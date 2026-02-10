import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendEmailRequest {
  to: string;
  subject: string;
  html: string;
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

    console.log(`Processing email request for user: ${user.id}`);

    // Get user's decrypted email credentials via secure RPC
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
    if (!cred || !cred.email_configured) {
      throw new Error('Email não configurado. Configure suas credenciais em Configurações.');
    }

    const { resend_api_key, email_from_address, email_from_name } = cred;

    // Parse request body
    const { to, subject, html, leadId, leadName }: SendEmailRequest = await req.json();

    if (!to || !subject || !html) {
      throw new Error('Destinatário, assunto e conteúdo são obrigatórios');
    }

    console.log(`Sending email to: ${to}`);

    // Send email via Resend API directly
    const fromAddress = email_from_name 
      ? `${email_from_name} <${email_from_address}>`
      : email_from_address;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resend_api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    const emailResult = await resendResponse.json();
    console.log('Email response:', emailResult);

    if (!resendResponse.ok) {
      console.error('Resend API error:', emailResult);
      throw new Error(emailResult.message || 'Erro ao enviar email');
    }

    // Log the message
    const { error: logError } = await supabaseClient
      .from('message_logs')
      .insert({
        user_id: user.id,
        lead_id: leadId || null,
        lead_name: leadName || to,
        channel: 'email',
        message: `Assunto: ${subject}`,
        status: 'sent',
      });

    if (logError) {
      console.error('Error logging message:', logError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailResult.id,
        message: 'Email enviado com sucesso!' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in send-email function:', error);
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
