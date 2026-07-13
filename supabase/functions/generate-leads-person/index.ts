import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Busca de PESSOA FÍSICA (B2C) via Perplexity + Gemini
// Foco: profissionais autônomos, criadores de conteúdo, influenciadores,
// prestadores independentes, perfis públicos com contato divulgado.
// NUNCA inventa dados pessoais — apenas o que a Perplexity trouxer com fonte.
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const { query, country, city, language, profileType } = await req.json();

    if (!query?.trim()) {
      return new Response(JSON.stringify({ error: 'Query is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    if (!PERPLEXITY_API_KEY) {
      return new Response(
        JSON.stringify({
          error: language === 'pt-BR'
            ? 'Busca por Pessoa Física ainda não configurada. Peça ao administrador para adicionar a chave PERPLEXITY_API_KEY.'
            : 'Person search not configured yet. Ask the administrator to add the PERPLEXITY_API_KEY.'
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const locationContext = [city, country].filter(Boolean).join(', ');
    const profileHint = profileType || (language === 'pt-BR' ? 'profissionais autônomos, criadores de conteúdo, influenciadores' : 'freelancers, content creators, influencers');

    console.log(`Person search: "${query}" @ ${locationContext} for user ${authData.claims.sub}`);

    const perplexityQuery = language === 'pt-BR'
      ? `Encontre PESSOAS FÍSICAS reais e verificáveis com presença pública online — ${profileHint} — relacionadas a: "${query}"${locationContext ? ` em ${locationContext}` : ''}.

Para cada pessoa liste, quando divulgado publicamente:
- Nome completo
- Profissão/área de atuação
- Instagram, LinkedIn, TikTok, YouTube ou site pessoal (URL completa)
- Email profissional / de contato (se divulgado publicamente)
- WhatsApp comercial (se divulgado publicamente)
- Cidade/região

REGRAS OBRIGATÓRIAS:
- SOMENTE dados publicamente divulgados pela própria pessoa (bio de rede social, site pessoal, mídia).
- NUNCA invente email, telefone ou WhatsApp.
- Cite todas as fontes (URLs) usadas.`
      : `Find real, verifiable INDIVIDUAL PEOPLE with public online presence — ${profileHint} — related to: "${query}"${locationContext ? ` in ${locationContext}` : ''}.

For each person list, when publicly available:
- Full name
- Profession / niche
- Instagram, LinkedIn, TikTok, YouTube or personal website (full URL)
- Business/contact email (only if publicly shared)
- Business WhatsApp (only if publicly shared)
- City/region

MANDATORY RULES:
- ONLY data publicly shared by the person themselves (social bio, personal site, press).
- NEVER invent email, phone or WhatsApp.
- Cite every source URL used.`;

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
            content: 'You research public profiles of real individuals. Only return people with verifiable public presence and cite every source. Never fabricate contact data.'
          },
          { role: 'user', content: perplexityQuery }
        ],
      }),
    });

    if (!perplexityResponse.ok) {
      const errorText = await perplexityResponse.text();
      console.error('Perplexity error:', perplexityResponse.status, errorText);
      if (perplexityResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: language === 'pt-BR' ? 'Limite da Perplexity atingido. Tente novamente em instantes.' : 'Perplexity rate limit reached. Try again shortly.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (perplexityResponse.status === 401) {
        return new Response(
          JSON.stringify({ error: language === 'pt-BR' ? 'Chave da Perplexity inválida. Contate o administrador.' : 'Invalid Perplexity key. Contact the administrator.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`Perplexity error: ${perplexityResponse.status}`);
    }

    const perplexityData = await perplexityResponse.json();
    const webContent = perplexityData.choices?.[0]?.message?.content || '';
    const citations = perplexityData.citations || [];

    console.log(`Perplexity returned ${citations.length} citations`);

    const extractionPrompt = language === 'pt-BR'
      ? `Extraia PESSOAS FÍSICAS estruturadas do texto abaixo. NUNCA invente contato.

TEXTO:
${webContent}

FONTES:
${citations.map((c: string, i: number) => `[${i + 1}] ${c}`).join('\n')}

Retorne APENAS JSON válido:
{
  "leads": [
    {
      "name": "Nome da pessoa",
      "position": "Profissão / área",
      "location": "Cidade/região ou null",
      "intentSignal": "Por que combina com '${query}'",
      "urgency": "high" | "medium" | "low",
      "email": "email público ou null",
      "phone": "telefone público ou null",
      "whatsapp": "whatsapp público ou null",
      "website": "site/rede social principal ou null",
      "sources": ["URLs das fontes"],
      "isCompetitor": false
    }
  ],
  "insights": {
    "pains": ["Dor 1", "Dor 2", "Dor 3"],
    "questions": ["Pergunta 1?", "Pergunta 2?", "Pergunta 3?"],
    "trends": ["Tendência 1", "Tendência 2"],
    "urgency": "medium",
    "urgencyReason": "Razão baseada nos dados"
  }
}`
      : `Extract structured INDIVIDUAL PEOPLE from the text below. NEVER invent contact info.

TEXT:
${webContent}

SOURCES:
${citations.map((c: string, i: number) => `[${i + 1}] ${c}`).join('\n')}

Return ONLY valid JSON:
{
  "leads": [
    {
      "name": "Person name",
      "position": "Profession / niche",
      "location": "City/region or null",
      "intentSignal": "Why they match '${query}'",
      "urgency": "high" | "medium" | "low",
      "email": "public email or null",
      "phone": "public phone or null",
      "whatsapp": "public whatsapp or null",
      "website": "main site/social or null",
      "sources": ["Source URLs"],
      "isCompetitor": false
    }
  ],
  "insights": {
    "pains": ["Pain 1", "Pain 2", "Pain 3"],
    "questions": ["Q1?", "Q2?", "Q3?"],
    "trends": ["Trend 1", "Trend 2"],
    "urgency": "medium",
    "urgencyReason": "Reason based on data"
  }
}`;

    const geminiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'Return only valid JSON. Never fabricate contact data.' },
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
      id: `person-${Date.now()}-${index}`,
      status: 'new',
      createdAt: new Date().toISOString(),
      sources: lead.sources || (lead.website ? [lead.website] : citations.slice(0, 2)),
    }));

    console.log(`Extracted ${leads.length} person leads`);

    return new Response(
      JSON.stringify({ leads, insights: parsedContent.insights }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in person lead search:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
