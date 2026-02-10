import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendSMSRequest {
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

    console.log(`Processing SMS request for user: ${user.id}`);

    // Get user's decrypted Twilio credentials via secure RPC
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: credentials, error: credentialsError } = await serviceClient
      .rpc('get_decrypted_credentials', { _user_id: user.id });

    if (credentialsError) {
      console.error('Error fetching credentials:', credentialsError);
      throw new Error('Erro ao buscar credenciais');
    }

    const cred = credentials?.[0];
    if (!cred || !cred.sms_configured) {
      throw new Error('SMS não configurado. Configure suas credenciais em Configurações.');
    }

    const { twilio_account_sid, twilio_auth_token, twilio_phone_number } = cred;

    // Parse request body
    const { to, message, leadId, leadName }: SendSMSRequest = await req.json();

    if (!to || !message) {
      throw new Error('Número de telefone e mensagem são obrigatórios');
    }

    // Format phone number (ensure it has country code)
    let formattedPhone = to.replace(/\D/g, '');
    if (!formattedPhone.startsWith('+')) {
      if (!formattedPhone.startsWith('55')) {
        formattedPhone = '55' + formattedPhone;
      }
      formattedPhone = '+' + formattedPhone;
    }

    console.log(`Sending SMS to: ${formattedPhone}`);

    // Send SMS via Twilio API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilio_account_sid}/Messages.json`;
    
    const authString = btoa(`${twilio_account_sid}:${twilio_auth_token}`);
    
    const formData = new URLSearchParams();
    formData.append('To', formattedPhone);
    formData.append('From', twilio_phone_number);
    formData.append('Body', message);

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const twilioResult = await twilioResponse.json();
    console.log('Twilio response:', twilioResult);

    if (!twilioResponse.ok) {
      console.error('Twilio API error:', twilioResult);
      throw new Error(twilioResult.message || 'Erro ao enviar SMS');
    }

    // Log the message
    const { error: logError } = await supabaseClient
      .from('message_logs')
      .insert({
        user_id: user.id,
        lead_id: leadId || null,
        lead_name: leadName || formattedPhone,
        channel: 'sms',
        message: message,
        status: 'sent',
      });

    if (logError) {
      console.error('Error logging message:', logError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: twilioResult.sid,
        message: 'SMS enviado com sucesso!' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in send-sms function:', error);
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
