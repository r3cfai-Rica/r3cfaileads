import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendWhatsAppRequest {
  to: string;
  message: string;
  leadId?: string;
  leadName?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    // Initialize Supabase client with user's token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get current user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    console.log(`Processing WhatsApp request for user: ${user.id}`);

    // Get user's WhatsApp credentials
    const { data: credentials, error: credentialsError } = await supabaseClient
      .from('user_messaging_credentials')
      .select('whatsapp_access_token, whatsapp_phone_number_id, whatsapp_configured')
      .eq('user_id', user.id)
      .maybeSingle();

    if (credentialsError) {
      console.error('Error fetching credentials:', credentialsError);
      throw new Error('Erro ao buscar credenciais');
    }

    if (!credentials || !credentials.whatsapp_configured) {
      throw new Error('WhatsApp não configurado. Configure suas credenciais em Configurações.');
    }

    const { whatsapp_access_token, whatsapp_phone_number_id } = credentials;

    // Parse request body
    const { to, message, leadId, leadName }: SendWhatsAppRequest = await req.json();

    if (!to || !message) {
      throw new Error('Número de telefone e mensagem são obrigatórios');
    }

    // Format phone number (remove non-digits, ensure country code)
    let formattedPhone = to.replace(/\D/g, '');
    if (!formattedPhone.startsWith('55')) {
      formattedPhone = '55' + formattedPhone;
    }

    console.log(`Sending WhatsApp message to: ${formattedPhone}`);

    // Send message via WhatsApp Business API
    const whatsappResponse = await fetch(
      `https://graph.facebook.com/v18.0/${whatsapp_phone_number_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${whatsapp_access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedPhone,
          type: 'text',
          text: {
            preview_url: false,
            body: message,
          },
        }),
      }
    );

    const whatsappResult = await whatsappResponse.json();

    if (!whatsappResponse.ok) {
      console.error('WhatsApp API error:', whatsappResult);
      throw new Error(whatsappResult.error?.message || 'Erro ao enviar mensagem');
    }

    console.log('WhatsApp message sent successfully:', whatsappResult);

    // Log the message
    const { error: logError } = await supabaseClient
      .from('message_logs')
      .insert({
        user_id: user.id,
        lead_id: leadId || null,
        lead_name: leadName || formattedPhone,
        channel: 'whatsapp',
        message: message,
        status: 'sent',
      });

    if (logError) {
      console.error('Error logging message:', logError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: whatsappResult.messages?.[0]?.id,
        message: 'Mensagem enviada com sucesso!' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in send-whatsapp function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
