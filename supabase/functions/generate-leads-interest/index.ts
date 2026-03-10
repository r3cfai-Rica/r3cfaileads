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

    const locationParts = [city, country].filter(Boolean);
    const locationStr = locationParts.join(', ');
    const langCode = language === 'pt-BR' ? 'pt-BR' : 'en';

    console.log(`Interest/Trends search: "${interest}", location: ${locationStr}, user: ${data.claims.sub}`);

    // Step 1: AI analyzes trending search behavior and demand patterns
    const trendsPrompt = language === 'pt-BR'
      ? `Você é um analista de tendências de mercado e comportamento de busca digital.

O interesse do público-alvo é: "${interest}"
Região: ${locationStr}

Analise as TENDÊNCIAS DE BUSCA e DEMANDA REAL para esse interesse:
1. O que as pessoas estão buscando no Google relacionado a "${interest}"?
2. Quais são as buscas mais populares e emergentes?
3. Que tipo de negócios/profissionais estão sendo mais procurados por esse público?
4. Quais são as tendências crescentes nesse segmento?

Com base nisso, gere uma lista de 10-15 negócios/profissionais REAIS que se beneficiariam dessas tendências na região ${locationStr}.

Retorne APENAS JSON:
{
  "trendingSearches": ["busca trending 1", "busca trending 2", "busca trending 3"],
  "demandSignals": ["sinal de demanda 1", "sinal de demanda 2"],
  "leads": [
    {
      "name": "Nome do negócio/profissional realista",
      "position": "Tipo de negócio",
      "location": "${locationStr}",
      "intentSignal": "Por que esse negócio se beneficia das tendências (ex: 'Buscas por aulas de yoga cresceram 40% na região')",
      "urgency": "high|medium|low",
      "relevanceReason": "Como se conecta ao interesse '${interest}'"
    }
  ]
}`
      : `You are a market trends and digital search behavior analyst.

The target audience interest is: "${interest}"
Region: ${locationStr}

Analyze SEARCH TRENDS and REAL DEMAND for this interest:
1. What are people searching for on Google related to "${interest}"?
2. What are the most popular and emerging searches?
3. What types of businesses/professionals are being sought by this audience?
4. What are the growing trends in this segment?

Based on this, generate a list of 10-15 REALISTIC businesses/professionals that would benefit from these trends in ${locationStr}.

Return ONLY JSON:
{
  "trendingSearches": ["trending search 1", "trending search 2", "trending search 3"],
  "demandSignals": ["demand signal 1", "demand signal 2"],
  "leads": [
    {
      "name": "Realistic business/professional name",
      "position": "Business type",
      "location": "${locationStr}",
      "intentSignal": "Why this business benefits from trends (e.g. 'Searches for yoga classes grew 40% in the region')",
      "urgency": "high|medium|low",
      "relevanceReason": "How it connects to the interest '${interest}'"
    }
  ]
}`;

    let leads: any[] = [];
    let trendingSearches: string[] = [];
    let demandSignals: string[] = [];

    try {
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'You are a market trends analyst. Respond ONLY with valid JSON, no markdown, no code blocks. Generate realistic business names and data based on real market patterns.' },
            { role: 'user', content: trendsPrompt }
          ],
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content;
        const jsonMatch = content?.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
        const parsed = JSON.parse(jsonMatch[1]?.trim() || content?.trim());
        
        trendingSearches = parsed.trendingSearches || [];
        demandSignals = parsed.demandSignals || [];
        
        if (parsed.leads?.length) {
          leads = parsed.leads.map((lead: any, index: number) => ({
            id: `lead-${Date.now()}-${index}`,
            name: lead.name || 'Unknown',
            position: lead.position || 'Business',
            location: lead.location || locationStr,
            intentSignal: lead.intentSignal || '',
            urgency: lead.urgency || 'medium',
            email: null,
            phone: null,
            whatsapp: null,
            sources: [],
            isCompetitor: false,
            interestRelevance: lead.urgency || 'medium',
            status: 'new',
            createdAt: new Date().toISOString(),
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to generate trend-based leads:', e);
    }

    // Step 2: If we have GOOGLE_API_KEY, enrich with real Google Places data
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
    
    if (GOOGLE_API_KEY && leads.length > 0) {
      console.log('Enriching with Google Places data...');
      
      // Use trending searches to find real businesses
      const searchTerms = trendingSearches.length > 0 
        ? trendingSearches.slice(0, 3).map(t => `${t} ${locationStr}`)
        : [`${interest} ${locationStr}`];

      const realPlaces: any[] = [];
      const seenIds = new Set<string>();

      for (const term of searchTerms) {
        try {
          const searchResponse = await fetch('https://places.googleapis.com/v1/places:searchText', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': GOOGLE_API_KEY,
              'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.businessStatus,places.types,places.primaryType,places.googleMapsUri',
            },
            body: JSON.stringify({
              textQuery: term,
              languageCode: langCode,
              maxResultCount: 5,
            }),
          });

          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            for (const place of (searchData.places || [])) {
              if (!seenIds.has(place.id)) {
                seenIds.add(place.id);
                realPlaces.push(place);
              }
            }
          }
        } catch (e) {
          console.warn(`Places search failed for "${term}":`, e);
        }
        if (realPlaces.length >= 10) break;
      }

      // Replace AI-generated leads with real Places data where possible
      if (realPlaces.length > 0) {
        const enrichedLeads = realPlaces.map((place: any, index: number) => {
          const phone = place.internationalPhoneNumber || place.nationalPhoneNumber || null;
          const sources: string[] = [];
          if (place.websiteUri) sources.push(place.websiteUri);
          if (place.googleMapsUri) sources.push(place.googleMapsUri);
          else sources.push(`https://www.google.com/maps/place/?q=place_id:${place.id}`);

          return {
            id: `lead-${Date.now()}-real-${index}`,
            name: place.displayName?.text || 'Unknown',
            position: place.primaryType?.replace(/_/g, ' ') || place.types?.[0]?.replace(/_/g, ' ') || 'Business',
            location: place.formattedAddress || '',
            intentSignal: trendingSearches.length > 0
              ? `${language === 'pt-BR' ? 'Tendência' : 'Trending'}: ${trendingSearches[0]} | Rating: ${place.rating || 'N/A'}/5`
              : `Rating: ${place.rating || 'N/A'}/5 (${place.userRatingCount || 0} reviews)`,
            urgency: (place.rating && place.rating >= 4) ? 'high' : 'medium',
            email: null,
            phone,
            whatsapp: phone,
            sources,
            isCompetitor: false,
            interestRelevance: (place.rating && place.rating >= 4) ? 'high' : 'medium',
            status: 'new',
            createdAt: new Date().toISOString(),
          };
        });

        // Merge: real places first, then AI-generated (marked differently)
        leads = [...enrichedLeads, ...leads.slice(0, 5)];
      }
    }

    // Step 3: Generate trend-focused insights
    const insightsPrompt = language === 'pt-BR'
      ? `Analise as tendências de busca para "${interest}" na região "${locationStr}".

Buscas trending identificadas: ${trendingSearches.join(', ') || 'N/A'}
Sinais de demanda: ${demandSignals.join(', ') || 'N/A'}

Retorne APENAS JSON:
{
  "pains": ["necessidade/dor do público que busca '${interest}' 1", "dor2", "dor3", "dor4"],
  "questions": ["o que as pessoas estão perguntando sobre '${interest}' 1?", "p2?", "p3?", "p4?"],
  "trends": ["tendência crescente 1", "tendência 2", "tendência 3"],
  "urgency": "medium",
  "urgencyReason": "razão baseada nas tendências"
}`
      : `Analyze search trends for "${interest}" in "${locationStr}".

Trending searches identified: ${trendingSearches.join(', ') || 'N/A'}
Demand signals: ${demandSignals.join(', ') || 'N/A'}

Return ONLY JSON:
{
  "pains": ["need/pain of audience searching for '${interest}' 1", "p2", "p3", "p4"],
  "questions": ["what people are asking about '${interest}' 1?", "q2?", "q3?", "q4?"],
  "trends": ["growing trend 1", "t2", "t3"],
  "urgency": "medium",
  "urgencyReason": "reason based on trends"
}`;

    let insights = null;
    try {
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-lite',
          messages: [
            { role: 'system', content: 'You are a search trends analyst. Respond ONLY with valid JSON, no markdown.' },
            { role: 'user', content: insightsPrompt }
          ],
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content;
        const jsonMatch = content?.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
        insights = JSON.parse(jsonMatch[1]?.trim() || content?.trim());
      }
    } catch (insightError) {
      console.warn('Failed to generate insights:', insightError);
    }

    console.log(`Interest/Trends search found ${leads.length} leads for "${interest}"`);

    return new Response(
      JSON.stringify({ leads, insights }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-leads-interest:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
