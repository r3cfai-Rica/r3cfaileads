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
    const { data: authData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !authData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { query, country, city, language } = await req.json();

    if (!query?.trim()) {
      return new Response(JSON.stringify({ error: 'Query is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    if (!PERPLEXITY_API_KEY) {
      return new Response(
        JSON.stringify({ error: language === 'pt-BR' ? 'Busca Web não configurada. Conecte o Perplexity nas configurações.' : 'Web Search not configured. Connect Perplexity in settings.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Web search for: "${query}", user: ${authData.claims.sub}`);

    // Step 1: Perplexity search
    const locationContext = [city, country].filter(Boolean).join(', ');
    const perplexityQuery = language === 'pt-BR'
      ? `Encontre negócios/empresas/profissionais reais: ${query}${locationContext ? ` em ${locationContext}` : ''}. Liste nomes, sites, telefones, emails e redes sociais quando disponíveis. Forneça o máximo de informações de contato possível.`
      : `Find real businesses/companies/professionals: ${query}${locationContext ? ` in ${locationContext}` : ''}. List names, websites, phones, emails and social media when available. Provide as much contact information as possible.`;

    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: 'You are a business research assistant. Find real businesses with verifiable contact information. Always include sources.'
          },
          { role: 'user', content: perplexityQuery }
        ],
      }),
    });

    if (!perplexityResponse.ok) {
      const errorText = await perplexityResponse.text();
      console.error('Perplexity API error:', perplexityResponse.status, errorText);

      if (perplexityResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`Perplexity API error: ${perplexityResponse.status}`);
    }

    const perplexityData = await perplexityResponse.json();
    const webContent = perplexityData.choices?.[0]?.message?.content || '';
    const citations = perplexityData.citations || [];

    console.log(`Perplexity returned ${citations.length} citations`);

    // Step 2: Gemini extracts structured leads
    const extractionPrompt = language === 'pt-BR'
      ? `Analise os resultados de busca abaixo e extraia leads de negócios estruturados.

RESULTADOS DA BUSCA:
${webContent}

FONTES/CITAÇÕES:
${citations.map((c: string, i: number) => `[${i + 1}] ${c}`).join('\n')}

Retorne APENAS um JSON válido com esta estrutura:
{
  "leads": [
    {
      "name": "Nome do negócio/profissional",
      "position": "Tipo/categoria do negócio",
      "location": "Localização se mencionada",
      "intentSignal": "Por que este lead é relevante para a busca '${query}'",
      "urgency": "high" | "medium" | "low",
      "email": "email se encontrado ou null",
      "phone": "telefone se encontrado ou null",
      "whatsapp": "whatsapp se encontrado ou null",
      "website": "site se encontrado ou null",
      "sources": ["URL da fonte onde foi encontrado"],
      "isCompetitor": false
    }
  ],
  "insights": {
    "pains": ["Dor/necessidade do mercado 1", "Dor 2", "Dor 3"],
    "questions": ["Pergunta frequente 1?", "Pergunta 2?", "Pergunta 3?"],
    "trends": ["Tendência 1", "Tendência 2"],
    "urgency": "medium",
    "urgencyReason": "Razão da urgência baseada nos dados encontrados"
  }
}

REGRAS:
- Extraia APENAS negócios/pessoas REAIS mencionados nos resultados
- Use as URLs das citações como fontes
- NÃO invente dados - se não encontrou, coloque null
- Inclua o máximo de leads possível dos resultados`
      : `Analyze the search results below and extract structured business leads.

SEARCH RESULTS:
${webContent}

SOURCES/CITATIONS:
${citations.map((c: string, i: number) => `[${i + 1}] ${c}`).join('\n')}

Return ONLY valid JSON with this structure:
{
  "leads": [
    {
      "name": "Business/professional name",
      "position": "Business type/category",
      "location": "Location if mentioned",
      "intentSignal": "Why this lead is relevant to the search '${query}'",
      "urgency": "high" | "medium" | "low",
      "email": "email if found or null",
      "phone": "phone if found or null",
      "whatsapp": "whatsapp if found or null",
      "website": "website if found or null",
      "sources": ["Source URL where found"],
      "isCompetitor": false
    }
  ],
  "insights": {
    "pains": ["Market pain 1", "Pain 2", "Pain 3"],
    "questions": ["Frequent question 1?", "Question 2?", "Question 3?"],
    "trends": ["Trend 1", "Trend 2"],
    "urgency": "medium",
    "urgencyReason": "Urgency reason based on found data"
  }
}

RULES:
- Extract ONLY REAL businesses/people mentioned in the results
- Use citation URLs as sources
- Do NOT invent data - use null if not found
- Include as many leads as possible from results`;

    const geminiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You extract structured data from search results. Return only valid JSON.' },
          { role: 'user', content: extractionPrompt }
        ],
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini error:', geminiResponse.status, errorText);

      if (geminiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (geminiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`Gemini error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const content = geminiData.choices?.[0]?.message?.content;

    let parsedContent;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1]?.trim() || content.trim();
      parsedContent = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      throw new Error('Failed to parse AI response');
    }

    const leads = (parsedContent.leads || []).map((lead: any, index: number) => ({
      ...lead,
      id: `web-${Date.now()}-${index}`,
      status: 'new',
      createdAt: new Date().toISOString(),
      sources: lead.sources || (lead.website ? [lead.website] : citations.slice(0, 2)),
    }));

    console.log(`Extracted ${leads.length} leads from web search`);

    return new Response(
      JSON.stringify({ leads, insights: parsedContent.insights }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in web lead search:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
