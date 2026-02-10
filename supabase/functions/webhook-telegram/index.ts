import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    date: number;
    text?: string;
    photo?: Array<{ file_id: string }>;
    document?: { file_id: string; file_name: string };
  };
}

// Best-effort Telegram signature verification
// Only rejects if a secret is configured AND header is present but wrong
function verifyTelegramSignature(req: Request): { verified: boolean; reason: string } {
  const secretToken = Deno.env.get('TELEGRAM_WEBHOOK_SECRET');
  if (!secretToken) {
    return { verified: true, reason: 'no secret configured, skipping verification' };
  }

  const headerToken = req.headers.get('x-telegram-bot-api-secret-token');
  if (!headerToken) {
    // Telegram only sends this header if setWebhook was called with secret_token
    // Don't reject if header is missing - it means webhook wasn't registered with secret_token yet
    console.warn('TELEGRAM_WEBHOOK_SECRET configured but no header received. Register webhook with secret_token to enable verification.');
    return { verified: true, reason: 'header not present, webhook may not be registered with secret_token' };
  }

  if (headerToken === secretToken) {
    return { verified: true, reason: 'signature valid' };
  }

  return { verified: false, reason: 'signature mismatch' };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  // Best-effort signature verification
  const sigCheck = verifyTelegramSignature(req);
  if (!sigCheck.verified) {
    console.error('Telegram webhook signature verification FAILED:', sigCheck.reason);
    return new Response(
      JSON.stringify({ error: 'Invalid signature' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  console.log('Telegram webhook auth:', sigCheck.reason);

  try {
    const update: TelegramUpdate = await req.json();
    
    console.log('Telegram webhook received');

    if (!update.message) {
      console.log('No message in update, skipping');
      return new Response(
        JSON.stringify({ received: true, processed: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const message = update.message;
    const chatId = message.chat.id.toString();
    const senderId = message.from.id.toString();
    const senderName = [message.from.first_name, message.from.last_name].filter(Boolean).join(' ');
    const senderUsername = message.from.username;
    const messageId = message.message_id.toString();

    let messageText = '';
    if (message.text) {
      messageText = message.text;
    } else if (message.photo) {
      messageText = '[Foto recebida]';
    } else if (message.document) {
      messageText = `[Documento: ${message.document.file_name}]`;
    } else {
      messageText = '[Mensagem não suportada]';
    }

    console.log(`Incoming Telegram from ${senderName} (${chatId})`);

    const { data: existingConvo, error: convoError } = await supabase
      .from('conversations')
      .select('id, user_id')
      .eq('lead_contact', chatId)
      .eq('channel', 'telegram')
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
          unread_count: 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingConvo.id);

      await supabase.from('inbox_messages').insert({
        conversation_id: existingConvo.id,
        user_id: existingConvo.user_id,
        channel: 'telegram',
        direction: 'inbound',
        content: messageText,
        status: 'delivered',
        external_id: messageId,
        metadata: {
          sender_name: senderName,
          sender_id: senderId,
          sender_username: senderUsername,
          chat_id: chatId,
          timestamp: message.date,
        },
      });

      console.log(`Message added to existing conversation: ${existingConvo.id}`);
    } else {
      const { data: leadData } = await supabase
        .from('leads')
        .select('id, user_id, name')
        .or(`whatsapp.eq.${chatId},phone.eq.${chatId}`)
        .limit(1)
        .maybeSingle();

      if (leadData) {
        const { data: newConvo } = await supabase
          .from('conversations')
          .insert({
            user_id: leadData.user_id,
            lead_id: leadData.id,
            lead_name: leadData.name || senderName,
            lead_contact: chatId,
            channel: 'telegram',
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
            channel: 'telegram',
            direction: 'inbound',
            content: messageText,
            status: 'delivered',
            external_id: messageId,
            metadata: {
              sender_name: senderName,
              sender_id: senderId,
              sender_username: senderUsername,
              chat_id: chatId,
              timestamp: message.date,
            },
          });

          console.log(`New conversation created for lead: ${leadData.name}`);
        }
      } else {
        console.log(`No matching lead found for chat: ${chatId}. Message logged but no conversation created.`);
      }
    }

    return new Response(
      JSON.stringify({ received: true, processed: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing Telegram webhook:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
