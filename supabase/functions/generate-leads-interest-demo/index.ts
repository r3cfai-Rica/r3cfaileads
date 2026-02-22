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

    const { interest, country, city, language } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Generating demo interest leads for: "${interest}", user: ${data.claims.sub}`);

    const systemPrompt = language === 'pt-BR'
      ? `Você é um especialista em geração de leads. O público-alvo tem interesse em: "${interest}".

REGRAS:
1. Gere leads de NEGÓCIOS que atendem pessoas com esse interesse
2. Exemplo: Se o interesse é "fitness", gere academias, lojas de suplementos, estúdios de yoga
3. Se o interesse é "pets", gere pet shops, clínicas veterinárias, hotéis para pets
4. Cada lead deve ter um campo "interestRelevance": "high", "medium" ou "low"
5. Inclua sinais de intenção específicos ao interesse
6. ESTES SÃO DADOS DE DEMONSTRAÇÃO - deixe isso claro nos dados

Responda APENAS com um JSON válido.`
      : `You are a lead generation specialist. The target audience is interested in: "${interest}".

RULES:
1. Generate leads of BUSINESSES that serve people with this interest
2. Example: If interest is "fitness", generate gyms, supplement stores, yoga studios
3. If interest is "pets", generate pet shops, vet clinics, pet hotels
4. Each lead must have "interestRelevance": "high", "medium", or "low"
5. Include intent signals specific to the interest
6. THESE ARE DEMO DATA - make this clear in the data

Respond ONLY with valid JSON.`;

    const userPrompt = language === 'pt-BR'
      ? `Gere 10 leads de negócios que atendem pessoas interessadas em "${interest}" na região ${city ? city + ', ' : ''}${country}.

Retorne JSON:
{
  "leads": [
    {
      "name": "Nome do negócio",
      "position": "Tipo de negócio",
      "location": "Cidade, País",
      "intentSignal": "Como este negócio atende o interesse '${interest}'",
      "urgency": "high",
      "interestRelevance": "high",
      "email": "email@exemplo.com ou null",
      "phone": "telefone ou null",
      "whatsapp": "whatsapp ou null",
      "sources": ["fonte1.com"],
      "isCompetitor": false
    }
  ],
  "insights": {
    "pains": ["Dor do público 1", "Dor 2", "Dor 3", "Dor 4"],
    "questions": ["Pergunta 1?", "Pergunta 2?", "Pergunta 3?", "Pergunta 4?"],
    "trends": ["Tendência 1", "Tendência 2", "Tendência 3"],
    "urgency": "medium",
    "urgencyReason": "Razão"
  }
}`
      : `Generate 10 business leads serving people interested in "${interest}" in ${city ? city + ', ' : ''}${country}.

Return JSON:
{
  "leads": [
    {
      "name": "Business name",
      "position": "Business type",
      "location": "City, Country",
      "intentSignal": "How this business serves the '${interest}' interest",
      "urgency": "high",
      "interestRelevance": "high",
      "email": "email@example.com or null",
      "phone": "phone or null",
      "whatsapp": "whatsapp or null",
      "sources": ["source1.com"],
      "isCompetitor": false
    }
  ],
  "insights": {
    "pains": ["Audience pain 1", "Pain 2", "Pain 3", "Pain 4"],
    "questions": ["Question 1?", "Question 2?", "Question 3?", "Question 4?"],
    "trends": ["Trend 1", "Trend 2", "Trend 3"],
    "urgency": "medium",
    "urgencyReason": "Reason"
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

    let parsedContent;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1]?.trim() || content.trim();
      parsedContent = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Failed to parse AI response');
    }

    const leads = parsedContent.leads.map((lead: any, index: number) => ({
      ...lead,
      id: `lead-${Date.now()}-${index}`,
      status: 'new',
      createdAt: new Date().toISOString(),
      interestRelevance: lead.interestRelevance || 'medium',
    }));

    return new Response(
      JSON.stringify({ leads, insights: parsedContent.insights }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating interest demo leads:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
