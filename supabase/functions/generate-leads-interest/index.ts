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

    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
    if (!GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY is not configured');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const locationParts = [city, country].filter(Boolean);
    const locationStr = locationParts.join(', ');
    const langCode = language === 'pt-BR' ? 'pt-BR' : 'en';

    console.log(`Interest-based search: "${interest}", location: ${locationStr}, user: ${data.claims.sub}`);

    // Step 1: AI translates interest into Google Places search terms
    const interestPrompt = language === 'pt-BR'
      ? `O público-alvo tem interesse em: "${interest}".

Que tipos de negócios atendem diretamente esse público? Pense em empresas cujos CLIENTES têm esse interesse.

Exemplo: Se o interesse é "fitness", retorne: academias, lojas de suplementos, estúdios de pilates, crossfit boxes, lojas de roupas esportivas.
Se o interesse é "culinária gourmet", retorne: lojas de utensílios de cozinha, escolas de gastronomia, empórios, adegas.
Se o interesse é "pets", retorne: pet shops, clínicas veterinárias, hotéis para pets, adestradores.

Retorne APENAS um JSON com 3-5 termos de busca para o Google Maps na região ${locationStr}:
{"searchTerms": ["termo1 ${locationStr}", "termo2 ${locationStr}"], "businessTypes": ["tipo de negócio 1", "tipo de negócio 2"]}`
      : `The target audience is interested in: "${interest}".

What types of businesses directly serve this audience? Think of companies whose CUSTOMERS have this interest.

Example: If interest is "fitness", return: gyms, supplement stores, pilates studios, crossfit boxes, sportswear stores.
If interest is "gourmet cooking", return: kitchen supply stores, culinary schools, specialty food shops, wine shops.
If interest is "pets", return: pet shops, veterinary clinics, pet hotels, dog trainers.

Return ONLY a JSON with 3-5 Google Maps search terms in ${locationStr}:
{"searchTerms": ["term1 ${locationStr}", "term2 ${locationStr}"], "businessTypes": ["business type 1", "business type 2"]}`;

    let searchTerms: string[] = [`${interest} ${locationStr}`];
    let businessTypes: string[] = [];

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
            { role: 'system', content: 'Respond ONLY with valid JSON, no markdown, no code blocks.' },
            { role: 'user', content: interestPrompt }
          ],
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content;
        const jsonMatch = content?.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
        const parsed = JSON.parse(jsonMatch[1]?.trim() || content?.trim());
        if (parsed.searchTerms?.length) {
          searchTerms = parsed.searchTerms.slice(0, 5);
          businessTypes = parsed.businessTypes || [];
        }
      }
    } catch (e) {
      console.warn('Failed to get interest search terms, using default:', e);
    }

    console.log('Interest search terms:', searchTerms);

    // Step 2: Search Google Places
    const allPlaces: any[] = [];
    const seenIds = new Set<string>();

    for (const term of searchTerms) {
      try {
        const searchResponse = await fetch('https://places.googleapis.com/v1/places:searchText', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_API_KEY,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.businessStatus,places.types,places.primaryType,places.regularOpeningHours,places.googleMapsUri',
          },
          body: JSON.stringify({
            textQuery: term,
            languageCode: langCode,
            maxResultCount: 8,
          }),
        });

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          for (const place of (searchData.places || [])) {
            if (!seenIds.has(place.id)) {
              seenIds.add(place.id);
              allPlaces.push(place);
            }
          }
        }
      } catch (e) {
        console.warn(`Search failed for term "${term}":`, e);
      }

      if (allPlaces.length >= 15) break;
    }

    if (allPlaces.length === 0) {
      return new Response(
        JSON.stringify({ leads: [], insights: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: AI classifies relevance to the interest
    const relevancePrompt = language === 'pt-BR'
      ? `O público-alvo tem interesse em: "${interest}".
Abaixo estão negócios encontrados no Google Maps. Classifique a RELEVÂNCIA de cada um para esse interesse:
- "high" = atende DIRETAMENTE esse interesse (ex: academia para "fitness")
- "medium" = atende INDIRETAMENTE (ex: loja de roupas esportivas para "fitness")  
- "low" = relação fraca com o interesse

${allPlaces.map((p, i) => `${i}. ${p.displayName?.text} (${p.primaryType || p.types?.[0] || 'unknown'}) - ${p.formattedAddress}`).join('\n')}

Retorne APENAS JSON: {"classifications": [{"index": 0, "relevance": "high", "reason": "motivo curto de como atende o interesse"}, ...]}`
      : `The target audience is interested in: "${interest}".
Below are businesses from Google Maps. Classify the RELEVANCE of each to this interest:
- "high" = DIRECTLY serves this interest (e.g. gym for "fitness")
- "medium" = INDIRECTLY serves this interest (e.g. sportswear store for "fitness")
- "low" = weak connection to the interest

${allPlaces.map((p, i) => `${i}. ${p.displayName?.text} (${p.primaryType || p.types?.[0] || 'unknown'}) - ${p.formattedAddress}`).join('\n')}

Return ONLY JSON: {"classifications": [{"index": 0, "relevance": "high", "reason": "short reason how it serves the interest"}, ...]}`;

    let classifications: {index: number; relevance: string; reason: string}[] = [];

    try {
      const classifyResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-lite',
          messages: [
            { role: 'system', content: 'Respond ONLY with valid JSON, no markdown, no code blocks.' },
            { role: 'user', content: relevancePrompt }
          ],
        }),
      });

      if (classifyResponse.ok) {
        const classifyData = await classifyResponse.json();
        const content = classifyData.choices?.[0]?.message?.content;
        const jsonMatch = content?.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
        const parsed = JSON.parse(jsonMatch[1]?.trim() || content?.trim());
        classifications = parsed.classifications || [];
      }
    } catch (e) {
      console.warn('Failed to classify places:', e);
    }

    const classMap = new Map<number, {relevance: string; reason: string}>();
    for (const c of classifications) {
      classMap.set(c.index, { relevance: c.relevance, reason: c.reason });
    }

    // Step 4: Transform into leads
    const leads = allPlaces.map((place: any, index: number) => {
      const phone = place.internationalPhoneNumber || place.nationalPhoneNumber || null;
      const sources: string[] = [];
      if (place.websiteUri) sources.push(place.websiteUri);
      if (place.googleMapsUri) {
        sources.push(place.googleMapsUri);
      } else {
        sources.push(`https://www.google.com/maps/place/?q=place_id:${place.id}`);
      }

      const classification = classMap.get(index);
      const relevance = classification?.relevance || 'medium';

      return {
        id: `lead-${Date.now()}-${index}`,
        name: place.displayName?.text || 'Unknown',
        position: place.primaryType?.replace(/_/g, ' ') || place.types?.[0]?.replace(/_/g, ' ') || 'Business',
        location: place.formattedAddress || '',
        intentSignal: classification?.reason || (place.rating
          ? `Rating: ${place.rating}/5 (${place.userRatingCount || 0} reviews)${place.businessStatus === 'OPERATIONAL' ? ' - Active' : ''}`
          : 'Listed on Google Maps'),
        urgency: relevance as string,
        email: null,
        phone,
        whatsapp: phone,
        sources,
        isCompetitor: false,
        interestRelevance: relevance,
        status: 'new',
        createdAt: new Date().toISOString(),
      };
    });

    // Sort by relevance: high first
    const relevanceOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    leads.sort((a: any, b: any) => (relevanceOrder[a.interestRelevance] || 1) - (relevanceOrder[b.interestRelevance] || 1));

    // Step 5: Generate insights focused on the interest
    const insightsPrompt = language === 'pt-BR'
      ? `Analise o interesse "${interest}" na região "${locationStr}".

Negócios encontrados que atendem esse público: ${leads.map((l: any) => l.name).join(', ')}.

Retorne APENAS JSON:
{
  "pains": ["dor/necessidade que pessoas com interesse em '${interest}' têm 1", "dor2", "dor3", "dor4"],
  "questions": ["pergunta que esse público faz 1?", "p2?", "p3?", "p4?"],
  "trends": ["tendência de mercado para '${interest}' 1", "t2", "t3"],
  "urgency": "medium",
  "urgencyReason": "razão"
}`
      : `Analyze the interest "${interest}" in "${locationStr}".

Businesses found serving this audience: ${leads.map((l: any) => l.name).join(', ')}.

Return ONLY JSON:
{
  "pains": ["pain/need people interested in '${interest}' have 1", "p2", "p3", "p4"],
  "questions": ["question this audience asks 1?", "q2?", "q3?", "q4?"],
  "trends": ["market trend for '${interest}' 1", "t2", "t3"],
  "urgency": "medium",
  "urgencyReason": "reason"
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
            { role: 'system', content: 'You are a market analyst. Respond ONLY with valid JSON, no markdown.' },
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

    console.log(`Interest search found ${leads.length} leads for "${interest}"`);

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
