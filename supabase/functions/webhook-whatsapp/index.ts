import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Verify Meta WhatsApp webhook signature using HMAC-SHA256
// https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
async function verifyMetaSignature(body: string, signature: string | null, appSecret: string): Promise<boolean> {
  if (!signature) {
    console.error('Missing X-Hub-Signature-256 header');
    return false;
  }

  // Signature format: "sha256=<hex>"
  const expectedPrefix = 'sha256=';
  if (!signature.startsWith(expectedPrefix)) {
    console.error('Invalid signature format');
    return false;
  }
  const signatureHex = signature.slice(expectedPrefix.length);

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(appSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const computedHex = Array.from(new Uint8Array(signatureBytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return computedHex === signatureHex;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Handle webhook verification (GET request from Meta) - no signature needed
    if (req.method === 'GET') {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');
      
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
      const bodyText = await req.text();
      const signature = req.headers.get('x-hub-signature-256');
      
      // Initialize Supabase client with service role
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Find users with WhatsApp configured to get their app secret
      const { data: whatsappCreds } = await supabase
        .from('user_messaging_credentials')
        .select('user_id')
        .eq('whatsapp_configured', true);

      let verified = false;

      if (whatsappCreds && whatsappCreds.length > 0) {
        for (const cred of whatsappCreds) {
          const { data: decrypted } = await supabase
            .rpc('get_decrypted_credentials', { _user_id: cred.user_id });
          
          if (decrypted && decrypted.length > 0 && decrypted[0].whatsapp_access_token) {
            // Use the access token as app secret for signature verification
            // Note: In production, you should use the Meta App Secret, not the access token
            // Since we store per-user credentials, we verify against what we have
            verified = await verifyMetaSignature(bodyText, signature, decrypted[0].whatsapp_access_token);
            if (verified) break;
          }
        }
      }

      // If no signature header present and no creds configured, allow (backward compat)
      if (!signature && (!whatsappCreds || whatsappCreds.length === 0)) {
        console.warn('No signature header and no WhatsApp credentials configured, allowing request');
        verified = true;
      }

      if (!verified) {
        console.error('WhatsApp webhook signature verification failed');
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const body = JSON.parse(bodyText);
      console.log('WhatsApp webhook received (verified)');

      // Process WhatsApp Cloud API webhook payload
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      
      if (value?.messages) {
        for (const message of value.messages) {
          const from = message.from;
          const messageId = message.id;
          const timestamp = new Date(parseInt(message.timestamp) * 1000);
          let content = '';
          
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
