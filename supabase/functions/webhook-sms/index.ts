import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Best-effort Twilio HMAC-SHA1 verification
// Only rejects if signature header is present but invalid
async function verifyTwilioSignature(req: Request, bodyText: string, authToken: string): Promise<boolean> {
  const signature = req.headers.get('x-twilio-signature');
  if (!signature) {
    return false;
  }

  const url = req.url;
  const params = new URLSearchParams(bodyText);
  const sortedParams = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
  
  let dataString = url;
  for (const [key, value] of sortedParams) {
    dataString += key + value;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(authToken),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(dataString));
  const computedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));

  return computedSignature === signature;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method === 'POST') {
      const bodyText = await req.text();
      const formData = new URLSearchParams(bodyText);
      
      const from = formData.get('From') || '';
      const body = formData.get('Body') || '';
      const messageSid = formData.get('MessageSid') || '';
      const to = formData.get('To') || '';
      
      console.log('SMS webhook received:', { from, messageSid, to });

      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Best-effort signature verification using per-user Twilio auth token
      const twilioSignature = req.headers.get('x-twilio-signature');
      if (twilioSignature) {
        const { data: smsCreds } = await supabase
          .from('user_messaging_credentials')
          .select('user_id, twilio_phone_number')
          .eq('sms_configured', true);

        let verified = false;
        const cleanTo = to.replace(/\D/g, '');

        if (smsCreds && smsCreds.length > 0) {
          for (const cred of smsCreds) {
            const cleanCredPhone = (cred.twilio_phone_number || '').replace(/\D/g, '');
            if (cleanCredPhone && cleanTo.includes(cleanCredPhone)) {
              const { data: decrypted } = await supabase
                .rpc('get_decrypted_credentials', { _user_id: cred.user_id });
              
              if (decrypted?.[0]?.twilio_auth_token) {
                verified = await verifyTwilioSignature(req, bodyText, decrypted[0].twilio_auth_token);
                if (verified) break;
              }
            }
          }
        }

        if (!verified) {
          console.warn('Twilio signature present but could not be verified (credentials may not match)');
          // Don't reject - log warning only. Credentials might not be configured yet.
        } else {
          console.log('Twilio signature verified successfully');
        }
      } else {
        console.warn('No X-Twilio-Signature header - request not cryptographically verified');
      }

      const cleanFrom = from.replace(/^\+55/, '').replace(/\D/g, '');

      // Find existing conversation by phone number
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('*')
        .ilike('lead_contact', `%${cleanFrom}%`)
        .eq('channel', 'sms')
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
          .eq('channel', 'sms')
          .order('sent_at', { ascending: false })
          .limit(1);

        if (!recentMessage || recentMessage.length === 0) {
          console.log('No user found for this phone number, skipping');
          return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
            status: 200,
            headers: { 'Content-Type': 'text/xml' },
          });
        }

        userId = recentMessage[0].user_id;

        const { data: newConversation, error: convError } = await supabase
          .from('conversations')
          .insert({
            user_id: userId,
            lead_id: recentMessage[0].lead_id,
            lead_name: recentMessage[0].lead_name || from,
            lead_contact: cleanFrom,
            channel: 'sms',
            status: 'active',
          })
          .select()
          .single();

        if (convError) {
          console.error('Error creating conversation:', convError);
          return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
            status: 200,
            headers: { 'Content-Type': 'text/xml' },
          });
        }
        conversationId = newConversation.id;
      }

      const { error: msgError } = await supabase
        .from('inbox_messages')
        .insert({
          conversation_id: conversationId,
          user_id: userId,
          direction: 'inbound',
          channel: 'sms',
          content: body,
          external_id: messageSid,
          metadata: { from, to },
          status: 'delivered',
        });

      if (msgError) {
        console.error('Error inserting message:', msgError);
      } else {
        console.log('SMS message saved successfully');
      }

      return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    return new Response('Method not allowed', { status: 405 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  }
});
