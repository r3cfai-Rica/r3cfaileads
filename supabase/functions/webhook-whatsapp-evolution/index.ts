import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EvolutionWebhookPayload {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    pushName?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
      imageMessage?: {
        caption?: string;
      };
    };
    messageType?: string;
    messageTimestamp?: number;
  };
}

// Best-effort Evolution API verification
function verifyEvolutionWebhook(req: Request): { valid: boolean; reason: string } {
  const apiKey = Deno.env.get('EVOLUTION_API_KEY');
  if (!apiKey) {
    return { valid: true, reason: 'No EVOLUTION_API_KEY configured, skipping verification' };
  }

  const headerApiKey = req.headers.get('apikey') || req.headers.get('x-api-key');
  if (headerApiKey) {
    if (headerApiKey === apiKey) {
      return { valid: true, reason: 'API key verified' };
    }
    return { valid: false, reason: 'API key mismatch' };
  }

  // No header sent - Evolution may not be configured to send it
  return { valid: true, reason: 'No API key header, allowing (Evolution may not send it)' };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  // Best-effort verification
  const authCheck = verifyEvolutionWebhook(req);
  if (!authCheck.valid) {
    console.error('Evolution webhook verification FAILED:', authCheck.reason);
    return new Response(
      JSON.stringify({ error: 'Invalid API key' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  console.log('Evolution webhook auth:', authCheck.reason);

  try {
    const payload: EvolutionWebhookPayload = await req.json();
    
    // Verify instance name if configured
    const expectedInstance = Deno.env.get('EVOLUTION_INSTANCE_NAME');
    if (expectedInstance && payload.instance !== expectedInstance) {
      console.warn(`Instance mismatch: expected ${expectedInstance}, got ${payload.instance}. Allowing but logging.`);
    }

    console.log('Evolution webhook received');

    if (payload.event !== 'messages.upsert' || payload.data?.key?.fromMe) {
      console.log('Skipping event:', payload.event, 'fromMe:', payload.data?.key?.fromMe);
      return new Response(
        JSON.stringify({ received: true, processed: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const messageData = payload.data;
    const remoteJid = messageData.key.remoteJid;
    const phoneNumber = remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');
    const senderName = messageData.pushName || phoneNumber;
    const messageId = messageData.key.id;

    let messageText = '';
    if (messageData.message?.conversation) {
      messageText = messageData.message.conversation;
    } else if (messageData.message?.extendedTextMessage?.text) {
      messageText = messageData.message.extendedTextMessage.text;
    } else if (messageData.message?.imageMessage?.caption) {
      messageText = `[Imagem] ${messageData.message.imageMessage.caption}`;
    } else {
      messageText = `[${messageData.messageType || 'Mensagem não suportada'}]`;
    }

    console.log(`Incoming WhatsApp from ${phoneNumber}`);

    const { data: existingConvo, error: convoError } = await supabase
      .from('conversations')
      .select('id, user_id')
      .eq('lead_contact', phoneNumber)
      .eq('channel', 'whatsapp')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (convoError) {
      console.error('Error finding conversation:', convoError);
    }

    if (existingConvo) {
      await supabase
        .from('conversations')
        .update({
          last_message: messageText,
          last_message_at: new Date().toISOString(),
          unread_count: existingConvo.user_id ? 1 : 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingConvo.id);

      await supabase.from('inbox_messages').insert({
        conversation_id: existingConvo.id,
        user_id: existingConvo.user_id,
        channel: 'whatsapp',
        direction: 'inbound',
        content: messageText,
        status: 'delivered',
        external_id: messageId,
        metadata: {
          sender_name: senderName,
          sender_phone: phoneNumber,
          timestamp: messageData.messageTimestamp,
          raw_event: payload.event,
        },
      });

      await supabase
        .from('message_logs')
        .update({ status: 'replied' })
        .eq('lead_name', senderName)
        .eq('channel', 'whatsapp')
        .eq('status', 'sent')
        .order('sent_at', { ascending: false })
        .limit(1);

      console.log(`Message added to existing conversation: ${existingConvo.id}`);
    } else {
      const { data: leadData } = await supabase
        .from('leads')
        .select('id, user_id, name')
        .or(`whatsapp.eq.${phoneNumber},phone.eq.${phoneNumber}`)
        .limit(1)
        .maybeSingle();

      if (leadData) {
        const { data: newConvo } = await supabase
          .from('conversations')
          .insert({
            user_id: leadData.user_id,
            lead_id: leadData.id,
            lead_name: leadData.name || senderName,
            lead_contact: phoneNumber,
            channel: 'whatsapp',
            last_message: messageText,
            last_message_at: new Date().toISOString(),
            status: 'active',
            unread_count: 1,
          })
          .select()
          .single();

        if (newConvo) {
          await supabase.from('inbox_messages').insert({
            conversation_id: newConvo.id,
            user_id: leadData.user_id,
            channel: 'whatsapp',
            direction: 'inbound',
            content: messageText,
            status: 'delivered',
            external_id: messageId,
            metadata: {
              sender_name: senderName,
              sender_phone: phoneNumber,
              timestamp: messageData.messageTimestamp,
            },
          });

          console.log(`New conversation created for lead: ${leadData.name}`);
        }
      } else {
        console.log(`No matching lead found for phone: ${phoneNumber}. Message logged but no conversation created.`);
      }
    }

    return new Response(
      JSON.stringify({ received: true, processed: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing Evolution webhook:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
