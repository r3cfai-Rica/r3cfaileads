import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SendWhatsAppRequest {
  to: string;
  message: string;
  leadId?: string;
  leadName: string;
  imageUrl?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    const { to, message, leadId, leadName, imageUrl }: SendWhatsAppRequest = await req.json();

    // Validate required fields
    if (!to || !message || !leadName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, message, leadName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Evolution API credentials
    const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL');
    const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY');
    const EVOLUTION_INSTANCE_NAME = Deno.env.get('EVOLUTION_INSTANCE_NAME');

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE_NAME) {
      console.error('Evolution API credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Evolution API not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format phone number (remove non-digits)
    const formattedPhone = to.replace(/\D/g, '');
    
    console.log(`Sending WhatsApp via Evolution API to: ${formattedPhone}`);

    // Send text message
    const textResponse = await fetch(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: formattedPhone,
        text: message,
      }),
    });

    if (!textResponse.ok) {
      const errorData = await textResponse.text();
      console.error('Evolution API error:', errorData);
      throw new Error(`Evolution API error: ${textResponse.status}`);
    }

    const textResult = await textResponse.json();
    console.log('Evolution API text response:', textResult);

    // Send image if provided
    if (imageUrl) {
      console.log(`Sending image: ${imageUrl}`);
      const imageResponse = await fetch(`${EVOLUTION_API_URL}/message/sendMedia/${EVOLUTION_INSTANCE_NAME}`, {
        method: 'POST',
        headers: {
          'apikey': EVOLUTION_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: formattedPhone,
          mediatype: 'image',
          media: imageUrl,
        }),
      });

      if (!imageResponse.ok) {
        console.warn('Failed to send image, but text was sent successfully');
      }
    }

    // Log the message
    const serviceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await serviceRoleClient.from('message_logs').insert({
      user_id: userId,
      lead_id: leadId || null,
      lead_name: leadName,
      channel: 'whatsapp',
      message: message,
      status: 'sent',
    });

    // Update or create conversation for inbox
    const { data: existingConvo } = await serviceRoleClient
      .from('conversations')
      .select('id')
      .eq('user_id', userId)
      .eq('lead_contact', formattedPhone)
      .eq('channel', 'whatsapp')
      .maybeSingle();

    if (existingConvo) {
      await serviceRoleClient
        .from('conversations')
        .update({
          last_message: message,
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingConvo.id);

      await serviceRoleClient.from('inbox_messages').insert({
        conversation_id: existingConvo.id,
        user_id: userId,
        channel: 'whatsapp',
        direction: 'outbound',
        content: message,
        status: 'sent',
        external_id: textResult.key?.id || null,
      });
    } else {
      const { data: newConvo } = await serviceRoleClient
        .from('conversations')
        .insert({
          user_id: userId,
          lead_id: leadId || null,
          lead_name: leadName,
          lead_contact: formattedPhone,
          channel: 'whatsapp',
          last_message: message,
          last_message_at: new Date().toISOString(),
          status: 'active',
        })
        .select()
        .single();

      if (newConvo) {
        await serviceRoleClient.from('inbox_messages').insert({
          conversation_id: newConvo.id,
          user_id: userId,
          channel: 'whatsapp',
          direction: 'outbound',
          content: message,
          status: 'sent',
          external_id: textResult.key?.id || null,
        });
      }
    }

    // Increment usage for premium users
    await serviceRoleClient.rpc('increment_messaging_usage', {
      _user_id: userId,
      _channel: 'whatsapp',
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: textResult.key?.id,
        message: 'WhatsApp sent via Evolution API' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-whatsapp-evolution:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to send WhatsApp' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
