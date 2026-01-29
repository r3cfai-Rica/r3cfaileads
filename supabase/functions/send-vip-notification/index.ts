import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendVipNotificationRequest {
  userEmail: string;
  userName: string;
  expiresAt: string;
  daysGranted: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    // Check if user is admin
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roles) {
      throw new Error('Apenas administradores podem enviar notificações VIP');
    }

    console.log(`Admin ${user.id} sending VIP notification`);

    // Get admin's email credentials
    const { data: credentials, error: credentialsError } = await supabaseClient
      .from('user_messaging_credentials')
      .select('resend_api_key, email_from_address, email_from_name, email_configured')
      .eq('user_id', user.id)
      .maybeSingle();

    if (credentialsError) {
      console.error('Error fetching credentials:', credentialsError);
      throw new Error('Erro ao buscar credenciais de email');
    }

    if (!credentials || !credentials.email_configured) {
      throw new Error('Configure suas credenciais de email em Configurações para enviar notificações VIP.');
    }

    const { resend_api_key, email_from_address, email_from_name } = credentials;

    const { userEmail, userName, expiresAt, daysGranted }: SendVipNotificationRequest = await req.json();

    if (!userEmail || !userName || !expiresAt) {
      throw new Error('Dados incompletos para envio de notificação');
    }

    const expirationDate = new Date(expiresAt);
    const formattedDate = expirationDate.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
          .header .crown { font-size: 48px; margin-bottom: 10px; }
          .content { padding: 40px 30px; }
          .content h2 { color: #333; margin-top: 0; }
          .highlight-box { background: linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%); border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .highlight-box strong { color: #667eea; }
          .features { margin: 20px 0; }
          .feature { padding: 10px 0; border-bottom: 1px solid #eee; display: flex; align-items: center; }
          .feature:last-child { border-bottom: none; }
          .feature .icon { font-size: 20px; margin-right: 10px; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="crown">👑</div>
            <h1>Acesso VIP Concedido!</h1>
          </div>
          <div class="content">
            <h2>Olá, ${userName}!</h2>
            <p>Parabéns! Você recebeu <strong>acesso VIP ilimitado</strong> à nossa plataforma.</p>
            
            <div class="highlight-box">
              <p style="margin: 0;"><strong>Duração:</strong> ${daysGranted} dias</p>
              <p style="margin: 10px 0 0 0;"><strong>Válido até:</strong> ${formattedDate}</p>
            </div>
            
            <p>Durante esse período, você terá acesso completo a todos os recursos premium:</p>
            
            <div class="features">
              <div class="feature">
                <span class="icon">🚀</span>
                <span>Prospecção ilimitada de leads</span>
              </div>
              <div class="feature">
                <span class="icon">📧</span>
                <span>Envio de mensagens sem limites</span>
              </div>
              <div class="feature">
                <span class="icon">🤖</span>
                <span>Geração de CTAs com IA</span>
              </div>
              <div class="feature">
                <span class="icon">📊</span>
                <span>Relatórios e análises avançadas</span>
              </div>
            </div>
            
            <p>Aproveite ao máximo esse período especial!</p>
          </div>
          <div class="footer">
            <p>Este é um email automático. Por favor, não responda.</p>
            <p>© ${new Date().getFullYear()} R3CF AI Leads. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log(`Sending VIP notification to: ${userEmail}`);

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
        to: [userEmail],
        subject: `👑 Você recebeu acesso VIP por ${daysGranted} dias!`,
        html: htmlContent,
      }),
    });

    const emailResult = await resendResponse.json();
    console.log('Email response:', emailResult);

    if (!resendResponse.ok) {
      console.error('Resend API error:', emailResult);
      throw new Error(emailResult.message || 'Erro ao enviar email de notificação');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailResult.id,
        message: 'Notificação VIP enviada com sucesso!' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in send-vip-notification function:', error);
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
