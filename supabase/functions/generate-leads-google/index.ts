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

    // Build search query
    const locationParts = [city, country].filter(Boolean);
    const textQuery = `${niche} ${locationParts.join(', ')}`;
    console.log(`Searching Google Places (New) for: ${textQuery}, user: ${data.claims.sub}`);

    // Step 1: Text Search (New API)
    const searchResponse = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.businessStatus,places.types,places.primaryType,places.regularOpeningHours',
      },
      body: JSON.stringify({
        textQuery,
        languageCode: language === 'pt-BR' ? 'pt-BR' : 'en',
        maxResultCount: 10,
      }),
    });

    const searchData = await searchResponse.json();

    if (!searchResponse.ok) {
      console.error('Google Places New API error:', JSON.stringify(searchData));
      throw new Error(`Google Places API error: ${searchData.error?.message || searchData.error?.status || 'Unknown error'}`);
    }

    const places = searchData.places || [];

    if (places.length === 0) {
      return new Response(
        JSON.stringify({ leads: [], insights: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Transform places into leads
    const leads = places.map((place: any, index: number) => {
      const phone = place.internationalPhoneNumber || place.nationalPhoneNumber || null;
      const sources: string[] = [];
      if (place.websiteUri) sources.push(place.websiteUri);
      sources.push(`https://www.google.com/maps/place/?q=place_id:${place.id}`);

      return {
        id: `lead-${Date.now()}-${index}`,
        name: place.displayName?.text || 'Unknown',
        position: place.primaryType?.replace(/_/g, ' ') || place.types?.[0]?.replace(/_/g, ' ') || 'Business',
        location: place.formattedAddress || '',
        intentSignal: place.rating
          ? `Rating: ${place.rating}/5 (${place.userRatingCount || 0} reviews)${place.businessStatus === 'OPERATIONAL' ? ' - Active' : ''}`
          : 'Listed on Google Maps',
        urgency: (place.userRatingCount && place.userRatingCount > 50 ? 'high' : place.userRatingCount && place.userRatingCount > 10 ? 'medium' : 'low'),
        email: null,
        phone,
        whatsapp: phone,
        sources,
        isCompetitor: false,
        status: 'new',
        createdAt: new Date().toISOString(),
      };
    });

    // Step 3: Use AI to generate insights
    const insightsPrompt = language === 'pt-BR'
      ? `Analise o nicho "${niche}" na região "${city || country}" com base nestes negócios reais: ${places.map((p: any) => p.displayName?.text).filter(Boolean).join(', ')}.

Retorne APENAS JSON:
{
  "pains": ["dor1", "dor2", "dor3", "dor4"],
  "questions": ["pergunta1?", "pergunta2?", "pergunta3?", "pergunta4?"],
  "trends": ["tendência1", "tendência2", "tendência3"],
  "urgency": "low",
  "urgencyReason": "razão"
}`
      : `Analyze the niche "${niche}" in "${city || country}" based on these real businesses: ${places.map((p: any) => p.displayName?.text).filter(Boolean).join(', ')}.

Return ONLY JSON:
{
  "pains": ["pain1", "pain2", "pain3", "pain4"],
  "questions": ["q1?", "q2?", "q3?", "q4?"],
  "trends": ["trend1", "trend2", "trend3"],
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

    console.log(`Found ${leads.length} real leads from Google Places`);

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
