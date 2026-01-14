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
    const { niche, country, city, postalCode, language } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Generating leads for niche: ${niche}, country: ${country}, city: ${city}`);

    const systemPrompt = language === 'pt-BR' 
      ? `Você é um especialista em geração de leads B2B. Sua tarefa é gerar leads realistas e qualificados para o nicho especificado.

REGRAS IMPORTANTES:
1. Gere leads que sejam POTENCIAIS COMPRADORES, não concorrentes
2. Cada lead deve ter sinais de intenção de compra realistas
3. Inclua dados de contato quando disponíveis publicamente
4. Marque concorrentes identificados com isCompetitor: true
5. Foque em decisores e influenciadores de compra

Responda APENAS com um JSON válido no formato especificado.`
      : `You are a B2B lead generation specialist. Your task is to generate realistic and qualified leads for the specified niche.

IMPORTANT RULES:
1. Generate leads that are POTENTIAL BUYERS, not competitors
2. Each lead should have realistic buying intent signals
3. Include contact data when publicly available
4. Mark identified competitors with isCompetitor: true
5. Focus on decision makers and buying influencers

Respond ONLY with valid JSON in the specified format.`;

    const userPrompt = language === 'pt-BR'
      ? `Gere 10 leads qualificados para o nicho "${niche}" na região ${city ? city + ', ' : ''}${country}.

Retorne um JSON com esta estrutura exata:
{
  "leads": [
    {
      "name": "Nome completo",
      "position": "Cargo/Posição",
      "location": "Cidade, País",
      "intentSignal": "Sinal de intenção de compra específico",
      "urgency": "low" | "medium" | "high",
      "email": "email@exemplo.com ou null",
      "phone": "telefone ou null",
      "whatsapp": "número whatsapp ou null",
      "sources": ["fonte1.com", "fonte2.com"],
      "isCompetitor": false
    }
  ],
  "insights": {
    "pains": ["Dor 1 do mercado", "Dor 2", "Dor 3", "Dor 4"],
    "questions": ["Pergunta comum 1?", "Pergunta 2?", "Pergunta 3?", "Pergunta 4?"],
    "trends": ["Tendência 1", "Tendência 2", "Tendência 3"],
    "urgency": "low" | "medium" | "high",
    "urgencyReason": "Razão da urgência do mercado"
  }
}`
      : `Generate 10 qualified leads for the niche "${niche}" in the region ${city ? city + ', ' : ''}${country}.

Return a JSON with this exact structure:
{
  "leads": [
    {
      "name": "Full name",
      "position": "Job title/Position",
      "location": "City, Country",
      "intentSignal": "Specific buying intent signal",
      "urgency": "low" | "medium" | "high",
      "email": "email@example.com or null",
      "phone": "phone number or null",
      "whatsapp": "whatsapp number or null",
      "sources": ["source1.com", "source2.com"],
      "isCompetitor": false
    }
  ],
  "insights": {
    "pains": ["Market pain 1", "Pain 2", "Pain 3", "Pain 4"],
    "questions": ["Common question 1?", "Question 2?", "Question 3?", "Question 4?"],
    "trends": ["Trend 1", "Trend 2", "Trend 3"],
    "urgency": "low" | "medium" | "high",
    "urgencyReason": "Market urgency reason"
  }
}`;

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
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1]?.trim() || content.trim();
      parsedContent = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Failed to parse AI response');
    }

    // Add IDs and timestamps to leads
    const leads = parsedContent.leads.map((lead: any, index: number) => ({
      ...lead,
      id: `lead-${Date.now()}-${index}`,
      status: 'new',
      createdAt: new Date().toISOString(),
    }));

    return new Response(
      JSON.stringify({
        leads,
        insights: parsedContent.insights,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating leads:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
