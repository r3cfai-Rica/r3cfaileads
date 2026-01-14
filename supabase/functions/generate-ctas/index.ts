import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { niche, insights, companyName, messageTone, imageFormat, language } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Generating CTAs for niche: ${niche}, tone: ${messageTone}, format: ${imageFormat}`);

    const toneDescriptions: Record<string, string> = {
      professional: language === 'pt-BR' ? 'profissional e sério' : 'professional and serious',
      friendly: language === 'pt-BR' ? 'amigável e casual' : 'friendly and casual',
      urgent: language === 'pt-BR' ? 'urgente e direto' : 'urgent and direct',
      inspirational: language === 'pt-BR' ? 'inspiracional e motivador' : 'inspirational and motivating',
    };

    const systemPrompt = language === 'pt-BR'
      ? `Você é um copywriter especialista em marketing digital e vendas. Sua tarefa é criar CTAs (Call-to-Actions) persuasivos e de alto impacto para campanhas de marketing.

DIRETRIZES:
1. Use gatilhos mentais como urgência, escassez, prova social e autoridade
2. Adapte o tom conforme solicitado
3. Cada CTA deve ser único e focado em conversão
4. Use emojis estrategicamente para aumentar engajamento
5. Textos devem ser adaptados para WhatsApp, SMS e Email

Responda APENAS com um JSON válido no formato especificado.`
      : `You are an expert copywriter in digital marketing and sales. Your task is to create persuasive, high-impact CTAs (Call-to-Actions) for marketing campaigns.

GUIDELINES:
1. Use mental triggers like urgency, scarcity, social proof and authority
2. Adapt the tone as requested
3. Each CTA should be unique and focused on conversion
4. Use emojis strategically to increase engagement
5. Texts should be adapted for WhatsApp, SMS and Email

Respond ONLY with valid JSON in the specified format.`;

    const insightsContext = insights 
      ? `
Insights do mercado:
- Dores: ${insights.pains?.join(', ')}
- Tendências: ${insights.trends?.join(', ')}
- Urgência: ${insights.urgency} (${insights.urgencyReason})
`
      : '';

    const userPrompt = language === 'pt-BR'
      ? `Crie 3 CTAs de alto impacto para o nicho "${niche}"${companyName ? ` da empresa "${companyName}"` : ''}.

Tom de voz: ${toneDescriptions[messageTone] || 'profissional'}
Formato da imagem: ${imageFormat}
${insightsContext}

Retorne um JSON com esta estrutura exata:
{
  "ctas": [
    {
      "title": "Título chamativo com emoji (max 60 caracteres)",
      "text": "Texto persuasivo completo para WhatsApp/Email (150-300 caracteres)",
      "imagePrompt": "Descrição detalhada para gerar uma imagem profissional relacionada ao nicho e ao CTA"
    }
  ]
}

Crie 3 CTAs diferentes, cada um com abordagem única.`
      : `Create 3 high-impact CTAs for the niche "${niche}"${companyName ? ` for the company "${companyName}"` : ''}.

Tone of voice: ${toneDescriptions[messageTone] || 'professional'}
Image format: ${imageFormat}
${insightsContext}

Return a JSON with this exact structure:
{
  "ctas": [
    {
      "title": "Catchy title with emoji (max 60 characters)",
      "text": "Complete persuasive text for WhatsApp/Email (150-300 characters)",
      "imagePrompt": "Detailed description to generate a professional image related to the niche and CTA"
    }
  ]
}

Create 3 different CTAs, each with a unique approach.`;

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
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    console.log('AI response content:', content);

    // Parse the JSON from the response
    let parsedContent;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1]?.trim() || content.trim();
      parsedContent = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Failed to parse AI response');
    }

    return new Response(
      JSON.stringify({ ctas: parsedContent.ctas }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating CTAs:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
