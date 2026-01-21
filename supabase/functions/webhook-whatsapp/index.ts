import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Handle webhook verification (GET request from Meta)
    if (req.method === 'GET') {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');
      
      // Verify token should match what you set in Meta dashboard
      const verifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN') || 'lovable_inbox_verify';
      
      if (mode === 'subscribe' && token === verifyToken) {
        console.log('WhatsApp webhook verified successfully');
        return new Response(challenge, { 
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        });
      } else {
        console.error('WhatsApp webhook verification failed');
        return new Response('Verification failed', { status: 403 });
      }
    }

    // Handle incoming messages (POST request)
    if (req.method === 'POST') {
      const body = await req.json();
      console.log('WhatsApp webhook received:', JSON.stringify(body));

      // Initialize Supabase client with service role
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Process WhatsApp Cloud API webhook payload
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      
      if (value?.messages) {
        for (const message of value.messages) {
          const from = message.from; // Phone number
          const messageId = message.id;
          const timestamp = new Date(parseInt(message.timestamp) * 1000);
          let content = '';
          
          // Extract message content based on type
          if (message.type === 'text') {
            content = message.text?.body || '';
          } else if (message.type === 'image') {
            content = '[Imagem recebida]';
          } else if (message.type === 'audio') {
            content = '[Áudio recebido]';
          } else if (message.type === 'video') {
            content = '[Vídeo recebido]';
          } else if (message.type === 'document') {
            content = '[Documento recebido]';
          } else {
            content = `[${message.type} recebido]`;
          }

          // Find existing conversation by phone number
          const { data: existingConversation } = await supabase
            .from('conversations')
            .select('*')
            .eq('lead_contact', from)
            .eq('channel', 'whatsapp')
            .single();

          let conversationId: string;
          let userId: string;

          if (existingConversation) {
            conversationId = existingConversation.id;
            userId = existingConversation.user_id;
          } else {
            // Try to find the user who sent a message to this number recently
            const { data: recentMessage } = await supabase
              .from('message_logs')
              .select('user_id, lead_id, lead_name')
              .eq('channel', 'whatsapp')
              .order('sent_at', { ascending: false })
              .limit(1);

            if (!recentMessage || recentMessage.length === 0) {
              console.log('No user found for this phone number, skipping');
              continue;
            }

            userId = recentMessage[0].user_id;

            // Create new conversation
            const { data: newConversation, error: convError } = await supabase
              .from('conversations')
              .insert({
                user_id: userId,
                lead_id: recentMessage[0].lead_id,
                lead_name: recentMessage[0].lead_name || from,
                lead_contact: from,
                channel: 'whatsapp',
                status: 'active',
              })
              .select()
              .single();

            if (convError) {
              console.error('Error creating conversation:', convError);
              continue;
            }
            conversationId = newConversation.id;
          }

          // Insert the inbound message
          const { error: msgError } = await supabase
            .from('inbox_messages')
            .insert({
              conversation_id: conversationId,
              user_id: userId,
              direction: 'inbound',
              channel: 'whatsapp',
              content: content,
              external_id: messageId,
              metadata: { 
                from,
                type: message.type,
                timestamp: timestamp.toISOString()
              },
              status: 'delivered',
            });

          if (msgError) {
            console.error('Error inserting message:', msgError);
          } else {
            console.log('WhatsApp message saved successfully');
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Method not allowed', { status: 405 });
  } catch (error: unknown) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
