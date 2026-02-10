import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !data?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { niche, insights, companyName, messageTone, imageFormat, language } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Generating CTAs for niche: ${niche}, tone: ${messageTone}, format: ${imageFormat}, user: ${data.claims.sub}`);

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
5. Textos devem ser adaptados para WhatsApp, SMS e Email`
      : `You are an expert copywriter in digital marketing and sales. Your task is to create persuasive, high-impact CTAs (Call-to-Actions) for marketing campaigns.

GUIDELINES:
1. Use mental triggers like urgency, scarcity, social proof and authority
2. Adapt the tone as requested
3. Each CTA should be unique and focused on conversion
4. Use emojis strategically to increase engagement
5. Texts should be adapted for WhatsApp, SMS and Email`;

    const insightsContext = insights 
      ? language === 'pt-BR'
        ? `Insights do mercado: Dores: ${insights.pains?.join(', ')}. Tendências: ${insights.trends?.join(', ')}. Urgência: ${insights.urgency} (${insights.urgencyReason}).`
        : `Market insights: Pains: ${insights.pains?.join(', ')}. Trends: ${insights.trends?.join(', ')}. Urgency: ${insights.urgency} (${insights.urgencyReason}).`
      : '';

    const userPrompt = language === 'pt-BR'
      ? `Crie 3 CTAs de alto impacto para o nicho "${niche}"${companyName ? ` da empresa "${companyName}"` : ''}. Tom de voz: ${toneDescriptions[messageTone] || 'profissional'}. Formato da imagem: ${imageFormat}. ${insightsContext}`
      : `Create 3 high-impact CTAs for the niche "${niche}"${companyName ? ` for the company "${companyName}"` : ''}. Tone of voice: ${toneDescriptions[messageTone] || 'professional'}. Image format: ${imageFormat}. ${insightsContext}`;

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
        tools: [
          {
            type: "function",
            function: {
              name: "generate_ctas",
              description: "Generate 3 high-impact CTAs for marketing campaigns",
              parameters: {
                type: "object",
                properties: {
                  ctas: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Catchy title with emoji (max 60 characters)" },
                        text: { type: "string", description: "Complete persuasive text for WhatsApp/Email (150-300 characters)" },
                        imagePrompt: { type: "string", description: "Detailed description to generate a professional image related to the niche and CTA" }
                      },
                      required: ["title", "text", "imagePrompt"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["ctas"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_ctas" } }
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
    console.log('AI response:', JSON.stringify(aiResponse, null, 2));

    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'generate_ctas') {
      throw new Error('No valid tool call in AI response');
    }

    let parsedContent;
    try {
      parsedContent = JSON.parse(toolCall.function.arguments);
    } catch (parseError) {
      console.error('Failed to parse tool call arguments:', parseError);
      throw new Error('Failed to parse AI response');
    }

    if (!parsedContent.ctas || !Array.isArray(parsedContent.ctas)) {
      throw new Error('Invalid CTA structure in response');
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
