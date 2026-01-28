import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SendTelegramRequest {
  chatId: string;
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
    const { chatId, message, leadId, leadName, imageUrl }: SendTelegramRequest = await req.json();

    // Validate required fields
    if (!chatId || !message || !leadName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: chatId, message, leadName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Telegram Bot Token
    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');

    if (!TELEGRAM_BOT_TOKEN) {
      console.error('Telegram Bot Token not configured');
      return new Response(
        JSON.stringify({ error: 'Telegram not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
    
    console.log(`Sending Telegram message to chat: ${chatId}`);

    // Send text message
    const textResponse = await fetch(`${telegramApiUrl}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!textResponse.ok) {
      const errorData = await textResponse.text();
      console.error('Telegram API error:', errorData);
      throw new Error(`Telegram API error: ${textResponse.status}`);
    }

    const textResult = await textResponse.json();
    console.log('Telegram API response:', textResult);

    // Send image if provided
    if (imageUrl) {
      console.log(`Sending image: ${imageUrl}`);
      const imageResponse = await fetch(`${telegramApiUrl}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          photo: imageUrl,
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
      channel: 'telegram',
      message: message,
      status: 'sent',
    });

    // Update or create conversation for inbox
    const { data: existingConvo } = await serviceRoleClient
      .from('conversations')
      .select('id')
      .eq('user_id', userId)
      .eq('lead_contact', chatId)
      .eq('channel', 'telegram')
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
        channel: 'telegram',
        direction: 'outbound',
        content: message,
        status: 'sent',
        external_id: textResult.result?.message_id?.toString() || null,
      });
    } else {
      const { data: newConvo } = await serviceRoleClient
        .from('conversations')
        .insert({
          user_id: userId,
          lead_id: leadId || null,
          lead_name: leadName,
          lead_contact: chatId,
          channel: 'telegram',
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
          channel: 'telegram',
          direction: 'outbound',
          content: message,
          status: 'sent',
          external_id: textResult.result?.message_id?.toString() || null,
        });
      }
    }

    // Increment usage for premium users
    await serviceRoleClient.rpc('increment_messaging_usage', {
      _user_id: userId,
      _channel: 'telegram',
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: textResult.result?.message_id,
        message: 'Telegram message sent successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-telegram:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to send Telegram message' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
