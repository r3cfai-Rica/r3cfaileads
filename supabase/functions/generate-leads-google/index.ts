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

    const { niche, country, city, postalCode, language } = await req.json();

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

    console.log(`Generating buyer-focused leads for niche: ${niche}, location: ${locationStr}, user: ${data.claims.sub}`);

    // Step 1: Use AI to determine what types of businesses/people would BUY this niche's services
    const buyerPrompt = language === 'pt-BR'
      ? `Você é um especialista em vendas B2B. O usuário vende/oferece: "${niche}".

Quem são os COMPRADORES ideais desse serviço/produto? NÃO liste concorrentes ou empresas que fazem a mesma coisa.

Exemplo: Se o nicho é "marketing digital", os compradores são restaurantes, clínicas, lojas, escritórios de advocacia, etc. NÃO agências de marketing.
Se o nicho é "contabilidade", os compradores são pequenas empresas, startups, MEIs, etc. NÃO outros contadores.

Retorne APENAS um JSON com 3-5 termos de busca para o Google Maps que encontrariam COMPRADORES potenciais na região ${locationStr}:
{"searchTerms": ["termo1 ${locationStr}", "termo2 ${locationStr}"], "buyerTypes": ["tipo de comprador 1", "tipo de comprador 2"]}`
      : `You are a B2B sales expert. The user sells/offers: "${niche}".

Who are the IDEAL BUYERS of this service/product? Do NOT list competitors or businesses that do the same thing.

Example: If niche is "digital marketing", buyers are restaurants, clinics, stores, law firms, etc. NOT marketing agencies.
If niche is "accounting", buyers are small businesses, startups, freelancers, etc. NOT other accountants.

Return ONLY a JSON with 3-5 Google Maps search terms to find POTENTIAL BUYERS in ${locationStr}:
{"searchTerms": ["term1 ${locationStr}", "term2 ${locationStr}"], "buyerTypes": ["buyer type 1", "buyer type 2"]}`;

    let searchTerms: string[] = [`${niche} ${locationStr}`];
    let buyerTypes: string[] = [];

    try {
      const buyerResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-lite',
          messages: [
            { role: 'system', content: 'Respond ONLY with valid JSON, no markdown, no code blocks.' },
            { role: 'user', content: buyerPrompt }
          ],
        }),
      });

      if (buyerResponse.ok) {
        const buyerData = await buyerResponse.json();
        const content = buyerData.choices?.[0]?.message?.content;
        const jsonMatch = content?.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
        const parsed = JSON.parse(jsonMatch[1]?.trim() || content?.trim());
        if (parsed.searchTerms?.length) {
          searchTerms = parsed.searchTerms.slice(0, 4);
          buyerTypes = parsed.buyerTypes || [];
        }
      }
    } catch (e) {
      console.warn('Failed to get buyer search terms, using default:', e);
    }

    console.log('Search terms for buyers:', searchTerms);

    // Step 2: Search Google Places with buyer-focused terms
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

      // Limit total to avoid excessive API costs
      if (allPlaces.length >= 15) break;
    }

    if (allPlaces.length === 0) {
      return new Response(
        JSON.stringify({ leads: [], insights: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Use AI to classify and filter — remove competitors, keep buyers
    const classifyPrompt = language === 'pt-BR'
      ? `O usuário vende/oferece: "${niche}".
Abaixo estão negócios encontrados no Google Maps. Classifique cada um:
- "buyer" = potencial COMPRADOR do serviço/produto "${niche}"
- "competitor" = concorrente ou empresa que oferece o MESMO serviço "${niche}"

${allPlaces.map((p, i) => `${i}. ${p.displayName?.text} (${p.primaryType || p.types?.[0] || 'unknown'}) - ${p.formattedAddress}`).join('\n')}

Retorne APENAS JSON: {"classifications": [{"index": 0, "type": "buyer", "reason": "motivo curto"}, ...]}`
      : `The user sells/offers: "${niche}".
Below are businesses from Google Maps. Classify each:
- "buyer" = potential BUYER of "${niche}" services
- "competitor" = competitor offering the SAME service "${niche}"

${allPlaces.map((p, i) => `${i}. ${p.displayName?.text} (${p.primaryType || p.types?.[0] || 'unknown'}) - ${p.formattedAddress}`).join('\n')}

Return ONLY JSON: {"classifications": [{"index": 0, "type": "buyer", "reason": "short reason"}, ...]}`;

    let classifications: {index: number; type: string; reason: string}[] = [];

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
            { role: 'user', content: classifyPrompt }
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

    // Build classification map
    const classMap = new Map<number, {type: string; reason: string}>();
    for (const c of classifications) {
      classMap.set(c.index, { type: c.type, reason: c.reason });
    }

    // Step 4: Transform into leads, marking competitors
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
      const isCompetitor = classification?.type === 'competitor';

      // Try to extract email from website URL domain for display hint
      let email: string | null = null;

      return {
        id: `lead-${Date.now()}-${index}`,
        name: place.displayName?.text || 'Unknown',
        position: place.primaryType?.replace(/_/g, ' ') || place.types?.[0]?.replace(/_/g, ' ') || 'Business',
        location: place.formattedAddress || '',
        intentSignal: classification?.reason || (place.rating
          ? `Rating: ${place.rating}/5 (${place.userRatingCount || 0} reviews)${place.businessStatus === 'OPERATIONAL' ? ' - Active' : ''}`
          : 'Listed on Google Maps'),
        urgency: (place.userRatingCount && place.userRatingCount > 50 ? 'high' : place.userRatingCount && place.userRatingCount > 10 ? 'medium' : 'low') as string,
        email,
        phone,
        whatsapp: phone,
        sources,
        isCompetitor,
        status: 'new',
        createdAt: new Date().toISOString(),
      };
    });

    // Sort: buyers first, competitors last
    leads.sort((a: any, b: any) => (a.isCompetitor === b.isCompetitor ? 0 : a.isCompetitor ? 1 : -1));

    // Step 5: Generate market insights
    const insightsPrompt = language === 'pt-BR'
      ? `Analise o nicho "${niche}" na região "${locationStr}". O usuário VENDE este serviço e busca COMPRADORES.

Empresas encontradas como potenciais compradores: ${leads.filter((l: any) => !l.isCompetitor).map((l: any) => l.name).join(', ')}.

Retorne APENAS JSON:
{
  "pains": ["dor que os COMPRADORES têm e que o nicho resolve 1", "dor2", "dor3", "dor4"],
  "questions": ["pergunta que compradores fazem antes de contratar 1?", "p2?", "p3?", "p4?"],
  "trends": ["tendência do mercado comprador 1", "t2", "t3"],
  "urgency": "low",
  "urgencyReason": "razão"
}`
      : `Analyze the niche "${niche}" in "${locationStr}". The user SELLS this service and seeks BUYERS.

Potential buyer businesses found: ${leads.filter((l: any) => !l.isCompetitor).map((l: any) => l.name).join(', ')}.

Return ONLY JSON:
{
  "pains": ["pain BUYERS have that this niche solves 1", "p2", "p3", "p4"],
  "questions": ["question buyers ask before hiring 1?", "q2?", "q3?", "q4?"],
  "trends": ["buyer market trend 1", "t2", "t3"],
  "urgency": "low",
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

    const buyerCount = leads.filter((l: any) => !l.isCompetitor).length;
    const competitorCount = leads.filter((l: any) => l.isCompetitor).length;
    console.log(`Found ${leads.length} leads (${buyerCount} buyers, ${competitorCount} competitors)`);

    return new Response(
      JSON.stringify({ leads, insights }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-leads-google:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
