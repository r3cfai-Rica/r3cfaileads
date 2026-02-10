import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Best-effort Resend/Svix header validation
function validateResendHeaders(req: Request): { valid: boolean; reason: string } {
  const svixId = req.headers.get('svix-id');
  const svixTimestamp = req.headers.get('svix-timestamp');
  const svixSignature = req.headers.get('svix-signature');

  if (svixId && svixTimestamp && svixSignature) {
    // Validate timestamp to prevent replay attacks (5 min window)
    const ts = parseInt(svixTimestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - ts) > 300) {
      return { valid: false, reason: 'Svix timestamp too old, possible replay attack' };
    }
    return { valid: true, reason: 'Svix headers present and timestamp valid' };
  }

  // No Svix headers - allow but log (could be direct webhook or other format)
  return { valid: true, reason: 'No Svix headers, allowing request (best-effort)' };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method === 'POST') {
      // Best-effort header validation
      const headerCheck = validateResendHeaders(req);
      if (!headerCheck.valid) {
        console.error('Email webhook validation failed:', headerCheck.reason);
        return new Response(JSON.stringify({ error: 'Invalid webhook request' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      console.log('Email webhook auth:', headerCheck.reason);

      const body = await req.json();
      console.log('Email webhook received:', JSON.stringify(body));

      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const type = body.type;
      const data = body.data;
      
      if (type === 'email.received' || type === 'email.delivered' || body.from) {
        const from = body.from || data?.from;
        const to = body.to || data?.to;
        const subject = body.subject || data?.subject || '';
        const content = body.text || body.html || data?.text || data?.html || '';
        const messageId = body.message_id || data?.email_id || body.id;

        const emailMatch = from?.match(/<([^>]+)>/) || [null, from];
        const fromEmail = emailMatch[1] || from;

        const { data: existingConversation } = await supabase
          .from('conversations')
          .select('*')
          .ilike('lead_contact', `%${fromEmail}%`)
          .eq('channel', 'email')
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
            .eq('channel', 'email')
            .order('sent_at', { ascending: false })
            .limit(1);

          if (!recentMessage || recentMessage.length === 0) {
            console.log('No user found for this email, skipping');
            return new Response(JSON.stringify({ success: true, skipped: true }), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          userId = recentMessage[0].user_id;

          const nameMatch = from?.match(/^([^<]+)\s*</) || [null, fromEmail];
          const senderName = nameMatch[1]?.trim() || fromEmail;

          const { data: newConversation, error: convError } = await supabase
            .from('conversations')
            .insert({
              user_id: userId,
              lead_id: recentMessage[0].lead_id,
              lead_name: recentMessage[0].lead_name || senderName,
              lead_contact: fromEmail,
              channel: 'email',
              status: 'active',
            })
            .select()
            .single();

          if (convError) {
            console.error('Error creating conversation:', convError);
            return new Response(JSON.stringify({ error: 'Failed to create conversation' }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
            channel: 'email',
            content: content,
            subject: subject,
            external_id: messageId,
            metadata: { from, to, subject },
            status: 'delivered',
          });

        if (msgError) {
          console.error('Error inserting message:', msgError);
          return new Response(JSON.stringify({ error: 'Failed to save message' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        console.log('Email message saved successfully');
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
