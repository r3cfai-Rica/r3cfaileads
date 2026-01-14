import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateEmailRequest {
  niche: string;
  leadName: string;
  leadPosition?: string;
  leadCompany?: string;
  cta?: {
    title: string;
    text: string;
  };
  senderName: string;
  senderCompany: string;
  tone: 'formal' | 'casual' | 'persuasive' | 'friendly';
  language: 'pt-BR' | 'en-US';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      niche, 
      leadName, 
      leadPosition,
      leadCompany,
      cta, 
      senderName,
      senderCompany,
      tone,
      language 
    }: GenerateEmailRequest = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const toneDescriptions = {
      'formal': language === 'pt-BR' ? 'profissional e corporativo' : 'professional and corporate',
      'casual': language === 'pt-BR' ? 'descontraído e amigável' : 'relaxed and friendly',
      'persuasive': language === 'pt-BR' ? 'persuasivo com gatilhos mentais' : 'persuasive with mental triggers',
      'friendly': language === 'pt-BR' ? 'próximo e empático' : 'warm and empathetic'
    };

    const systemPrompt = language === 'pt-BR' 
      ? `Você é um especialista em copywriting e email marketing B2B. Sua função é criar emails comerciais altamente persuasivos e personalizados que geram conversões.

REGRAS IMPORTANTES:
1. O email deve ser personalizado para o lead específico
2. Use o tom ${toneDescriptions[tone]}
3. O email deve ter: assunto impactante, saudação personalizada, introdução que gera curiosidade, corpo com benefícios claros, CTA forte, e assinatura profissional
4. Máximo de 300 palavras no corpo do email
5. Use gatilhos mentais apropriados (escassez, autoridade, prova social, urgência)
6. Evite parecer spam - seja genuíno e relevante
7. Se houver um CTA fornecido, integre-o naturalmente no email

Retorne APENAS um JSON válido no formato:
{
  "subject": "assunto do email",
  "greeting": "saudação personalizada",
  "body": "corpo completo do email em HTML simples (use <p>, <strong>, <br>)",
  "signature": "assinatura profissional em HTML",
  "previewText": "texto de preview (máx 90 caracteres)"
}`
      : `You are a B2B copywriting and email marketing specialist. Your role is to create highly persuasive and personalized commercial emails that generate conversions.

IMPORTANT RULES:
1. The email must be personalized for the specific lead
2. Use a ${toneDescriptions[tone]} tone
3. The email should have: impactful subject line, personalized greeting, curiosity-generating introduction, body with clear benefits, strong CTA, and professional signature
4. Maximum 300 words in the email body
5. Use appropriate mental triggers (scarcity, authority, social proof, urgency)
6. Avoid looking like spam - be genuine and relevant
7. If a CTA is provided, integrate it naturally into the email

Return ONLY a valid JSON in the format:
{
  "subject": "email subject",
  "greeting": "personalized greeting",
  "body": "complete email body in simple HTML (use <p>, <strong>, <br>)",
  "signature": "professional signature in HTML",
  "previewText": "preview text (max 90 characters)"
}`;

    const userPrompt = language === 'pt-BR'
      ? `Crie um email comercial para:
- Nicho/Produto: ${niche}
- Nome do Lead: ${leadName}
- Cargo: ${leadPosition || 'Não especificado'}
- Empresa: ${leadCompany || 'Não especificada'}
- Remetente: ${senderName} da ${senderCompany}
${cta ? `- CTA a incorporar: "${cta.title}" - ${cta.text}` : '- Crie um CTA apropriado para o nicho'}

Gere um email completo e pronto para envio.`
      : `Create a commercial email for:
- Niche/Product: ${niche}
- Lead Name: ${leadName}
- Position: ${leadPosition || 'Not specified'}
- Company: ${leadCompany || 'Not specified'}
- Sender: ${senderName} from ${senderCompany}
${cta ? `- CTA to incorporate: "${cta.title}" - ${cta.text}` : '- Create an appropriate CTA for the niche'}

Generate a complete email ready to send.`;

    console.log('Generating email for:', { niche, leadName, tone });

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('Failed to generate email');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from AI');
    }

    console.log('AI Response:', content);

    // Parse the JSON response
    let emailData;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        emailData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Parse error:', parseError);
      throw new Error('Failed to parse email data');
    }

    return new Response(JSON.stringify({ email: emailData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-email function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
