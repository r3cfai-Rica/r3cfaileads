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
    // Twilio sends POST requests with form-urlencoded data
    if (req.method === 'POST') {
      const formData = await req.formData();
      
      const from = formData.get('From') as string; // Phone number
      const body = formData.get('Body') as string; // Message content
      const messageSid = formData.get('MessageSid') as string; // Twilio message ID
      const to = formData.get('To') as string; // Your Twilio number
      
      console.log('SMS webhook received:', { from, body, messageSid, to });

      // Initialize Supabase client with service role
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Clean phone number (remove +55 prefix if present)
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
        // Try to find a user who sent SMS to this number
        const { data: recentMessage } = await supabase
          .from('message_logs')
          .select('user_id, lead_id, lead_name')
          .eq('channel', 'sms')
          .order('sent_at', { ascending: false })
          .limit(1);

        if (!recentMessage || recentMessage.length === 0) {
          console.log('No user found for this phone number, skipping');
          // Return TwiML empty response
          return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
            status: 200,
            headers: { 'Content-Type': 'text/xml' },
          });
        }

        userId = recentMessage[0].user_id;

        // Create new conversation
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

      // Insert the inbound message
      const { error: msgError } = await supabase
        .from('inbox_messages')
        .insert({
          conversation_id: conversationId,
          user_id: userId,
          direction: 'inbound',
          channel: 'sms',
          content: body,
          external_id: messageSid,
          metadata: { 
            from,
            to,
          },
          status: 'delivered',
        });

      if (msgError) {
        console.error('Error inserting message:', msgError);
      } else {
        console.log('SMS message saved successfully');
      }

      // Return empty TwiML response (required by Twilio)
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
