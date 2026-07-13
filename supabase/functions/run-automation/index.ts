import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const { automationId, triggeredBy } = await req.json();

    // If triggered by user, verify auth
    if (triggeredBy === 'user') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const supabaseUser = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const token = authHeader.replace('Bearer ', '');
      const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
      if (claimsError || !claimsData?.claims) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Fetch the automation
    const { data: automation, error: fetchError } = await supabaseAdmin
      .from('automations')
      .select('*')
      .eq('id', automationId)
      .single();

    if (fetchError || !automation) {
      return new Response(JSON.stringify({ error: 'Automation not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Create a robot run record
    const { data: run, error: runError } = await supabaseAdmin
      .from('robot_runs')
      .insert({
        robot_id: automationId,
        user_id: automation.user_id,
        status: 'running',
      })
      .select()
      .single();

    if (runError) {
      console.error('Failed to create run record:', runError);
      return new Response(JSON.stringify({ error: 'Failed to create run' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let leadsFound = 0;
    let leadsSaved = 0;
    let errorMessage: string | null = null;

    try {
      const isB2B = automation.lead_type === 'b2b' || automation.lead_type === 'both';
      const isTrends = automation.lead_type === 'trends';

      if (isB2B || isTrends) {
        const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

        if (!GOOGLE_API_KEY) {
          throw new Error('Google Places API não configurada. Este robô requer plano Premium com Google API Key ativa.');
        }
        if (!LOVABLE_API_KEY) {
          throw new Error('Lovable AI Gateway indisponível. Tente novamente em instantes.');
        }

        const countryName = automation.country || 'Brazil';
        const cityName = automation.city || '';
        const locationStr = [cityName, countryName].filter(Boolean).join(', ');

        // Step 1: Get search terms from AI (B2B = ideal buyers; Trends = trending demand)
        const buyerPrompt = isTrends
          ? `You are a market trends analyst. Given the niche "${automation.niche}" in "${locationStr}", identify what people are CURRENTLY SEARCHING FOR on Google related to this niche (real demand signals, problems, hot topics).
Return ONLY JSON: {"searchTerms": ["trending term 1 ${locationStr}", "trending term 2 ${locationStr}", "trending term 3 ${locationStr}"]}`
          : `You are a B2B sales expert. The user sells/offers: "${automation.niche}".
Who are the IDEAL BUYERS? Do NOT list competitors.
Return ONLY JSON: {"searchTerms": ["term1 ${locationStr}", "term2 ${locationStr}"], "buyerTypes": ["type1"]}`;

        let searchTerms = [`${automation.niche} ${locationStr}`];

        try {
          const buyerResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash-lite',
              messages: [
                { role: 'system', content: 'Respond ONLY with valid JSON.' },
                { role: 'user', content: buyerPrompt }
              ],
            }),
          });
          if (buyerResp.ok) {
            const d = await buyerResp.json();
            const c = d.choices?.[0]?.message?.content;
            const m = c?.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, c];
            const p = JSON.parse(m[1]?.trim() || c?.trim());
            if (p.searchTerms?.length) searchTerms = p.searchTerms.slice(0, 4);
          }
        } catch (e) {
          console.warn('Failed to get buyer terms:', e);
        }

        // Step 2: Search Google Places
        const allPlaces: any[] = [];
        const seenIds = new Set<string>();
        const maxLeads = automation.max_leads_per_run || 50;

        for (const term of searchTerms) {
          try {
            const resp = await fetch('https://places.googleapis.com/v1/places:searchText', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_API_KEY,
                'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.businessStatus,places.types,places.primaryType,places.googleMapsUri',
              },
              body: JSON.stringify({ textQuery: term, languageCode: 'pt-BR', maxResultCount: Math.min(maxLeads, 20) }),
            });
            if (resp.ok) {
              const d = await resp.json();
              for (const place of (d.places || [])) {
                if (!seenIds.has(place.id)) {
                  seenIds.add(place.id);
                  allPlaces.push(place);
                }
              }
            }
          } catch (e) {
            console.warn(`Search failed for "${term}":`, e);
          }
          if (allPlaces.length >= maxLeads) break;
        }

        leadsFound = allPlaces.length;

        if (allPlaces.length === 0) {
          throw new Error('No places found for the given niche and location');
        }

        // Step 3: Deduplication - check existing leads by place_id
        const placeIds = allPlaces.map(p => p.id);
        let existingPlaceIds = new Set<string>();

        if (automation.deduplicate) {
          const { data: existing } = await supabaseAdmin
            .from('leads')
            .select('place_id')
            .eq('user_id', automation.user_id)
            .in('place_id', placeIds);
          existingPlaceIds = new Set((existing || []).map((e: any) => e.place_id).filter(Boolean));
        }

        // Step 4: Transform and save
        const newPlaces = allPlaces.filter(p => !existingPlaceIds.has(p.id));

        if (newPlaces.length > 0) {
          const insertData = newPlaces.map(place => {
            const phone = place.internationalPhoneNumber || place.nationalPhoneNumber || null;
            const sources: string[] = [];
            if (place.websiteUri) sources.push(place.websiteUri);
            if (place.googleMapsUri) sources.push(place.googleMapsUri);

            return {
              user_id: automation.user_id,
              name: place.displayName?.text || 'Unknown',
              position: place.primaryType?.replace(/_/g, ' ') || 'Business',
              location: place.formattedAddress || '',
              intent_signal: `Rating: ${place.rating || 'N/A'}/5 (${place.userRatingCount || 0} reviews)`,
              urgency: (place.userRatingCount && place.userRatingCount > 50 ? 'high' : place.userRatingCount && place.userRatingCount > 10 ? 'medium' : 'low'),
              email: null,
              phone,
              whatsapp: phone,
              sources,
              is_competitor: false,
              status: 'new',
              folder_id: automation.folder_id,
              place_id: place.id,
              website: place.websiteUri || null,
              tags: place.types || [],
            };
          });

          const { data: saved, error: saveError } = await supabaseAdmin
            .from('leads')
            .insert(insertData)
            .select('id');

          if (saveError) {
            console.error('Error saving leads:', saveError);
            throw new Error(`Failed to save leads: ${saveError.message}`);
          }

          leadsSaved = saved?.length || 0;

          // Update folder lead count
          if (automation.folder_id && leadsSaved > 0) {
            const { data: folder } = await supabaseAdmin
              .from('folders')
              .select('lead_count')
              .eq('id', automation.folder_id)
              .single();
            
            if (folder) {
              await supabaseAdmin
                .from('folders')
                .update({ lead_count: folder.lead_count + leadsSaved })
                .eq('id', automation.folder_id);
            }
          }
        }
      }

      // Pessoa Física (B2C real via Perplexity)
      if (automation.lead_type === 'person') {
        const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
        if (!PERPLEXITY_API_KEY) {
          throw new Error('Busca por Pessoa Física indisponível: PERPLEXITY_API_KEY não configurada.');
        }
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
        if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured.');

        const locationStr = [automation.city, automation.country].filter(Boolean).join(', ');
        const maxLeads = automation.max_leads_per_run || 50;

        const perplexityQuery = `Encontre PESSOAS FÍSICAS reais e verificáveis (profissionais autônomos, criadores, influenciadores) relacionadas a "${automation.niche}"${locationStr ? ` em ${locationStr}` : ''}. Liste nome, profissão, redes sociais, email/WhatsApp públicos e cidade. NUNCA invente contato.`;

        const pResp = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${PERPLEXITY_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'sonar-pro',
            messages: [
              { role: 'system', content: 'You research public profiles of real individuals with verifiable presence. Cite sources. Never fabricate.' },
              { role: 'user', content: perplexityQuery },
            ],
          }),
        });

        if (!pResp.ok) {
          const t = await pResp.text();
          throw new Error(`Perplexity ${pResp.status}: ${t.slice(0, 200)}`);
        }
        const pData = await pResp.json();
        const webContent = pData.choices?.[0]?.message?.content || '';
        const citations = pData.citations || [];

        const extractPrompt = `Extraia pessoas físicas do texto. Retorne APENAS JSON: {"leads":[{"name":"...","position":"...","location":"...","email":null,"phone":null,"whatsapp":null,"website":"...","sources":["..."]}]}\n\nTEXTO:\n${webContent}\n\nFONTES:\n${citations.map((c: string, i: number) => `[${i + 1}] ${c}`).join('\n')}`;

        const gResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages: [
              { role: 'system', content: 'Return only valid JSON. Never fabricate contact.' },
              { role: 'user', content: extractPrompt },
            ],
          }),
        });

        if (!gResp.ok) throw new Error(`Gemini ${gResp.status}`);
        const gData = await gResp.json();
        const content = gData.choices?.[0]?.message?.content || '';
        const m = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
        const parsed = JSON.parse(m[1]?.trim() || content.trim());
        const personLeads = (parsed.leads || []).slice(0, maxLeads);

        leadsFound = personLeads.length;

        if (personLeads.length > 0) {
          // Deduplication by (name + website) since person leads have no place_id
          let existingKeys = new Set<string>();
          if (automation.deduplicate) {
            const { data: existing } = await supabaseAdmin
              .from('leads')
              .select('name, website')
              .eq('user_id', automation.user_id)
              .eq('folder_id', automation.folder_id);
            existingKeys = new Set((existing || []).map((e: any) => `${(e.name || '').toLowerCase()}|${e.website || ''}`));
          }

          const newLeads = personLeads.filter((l: any) => !existingKeys.has(`${(l.name || '').toLowerCase()}|${l.website || ''}`));

          if (newLeads.length > 0) {
            const insertData = newLeads.map((l: any) => ({
              user_id: automation.user_id,
              name: l.name || 'Unknown',
              position: l.position || 'Person',
              location: l.location || '',
              intent_signal: l.intentSignal || `Matches: ${automation.niche}`,
              urgency: l.urgency || 'medium',
              email: l.email || null,
              phone: l.phone || null,
              whatsapp: l.whatsapp || null,
              sources: l.sources || [],
              is_competitor: false,
              status: 'new',
              folder_id: automation.folder_id,
              website: l.website || null,
              tags: ['person', 'perplexity'],
            }));

            const { data: saved, error: saveError } = await supabaseAdmin
              .from('leads')
              .insert(insertData)
              .select('id');

            if (saveError) throw new Error(`Failed to save person leads: ${saveError.message}`);
            leadsSaved = saved?.length || 0;

            if (automation.folder_id && leadsSaved > 0) {
              const { data: folder } = await supabaseAdmin.from('folders').select('lead_count').eq('id', automation.folder_id).single();
              if (folder) {
                await supabaseAdmin.from('folders').update({ lead_count: folder.lead_count + leadsSaved }).eq('id', automation.folder_id);
              }
            }
          }
        }
      }

      // B2C opt-in via CSV/formulários — ainda sem automação
      if (automation.lead_type === 'b2c') {
        errorMessage = 'B2C Opt-in ainda não é suportado em robôs. Use Importação CSV ou conecte Meta Lead Ads na Prospecção.';
      }

    } catch (e) {
      errorMessage = e instanceof Error ? e.message : 'Unknown error';
      console.error('Automation execution error:', errorMessage);
    }

    // Calculate next run
    const now = new Date();
    let nextRun: string | null = null;
    if (automation.is_active && !errorMessage?.includes('API keys not configured')) {
      const freq = automation.frequency;
      const next = new Date(now);
      if (freq === 'hourly') next.setHours(next.getHours() + 1);
      else if (freq === 'daily') next.setDate(next.getDate() + 1);
      else if (freq === 'weekly') next.setDate(next.getDate() + 7);
      else if (freq === 'monthly') next.setMonth(next.getMonth() + 1);

      // Check end_date
      if (automation.end_date && new Date(automation.end_date) < next) {
        nextRun = null;
      } else {
        nextRun = next.toISOString();
      }
    }

    // Update automation
    await supabaseAdmin
      .from('automations')
      .update({
        last_run: now.toISOString(),
        last_status: errorMessage ? 'error' : 'success',
        last_error: errorMessage || null,
        last_leads_saved: leadsSaved,
        total_leads_found: (automation.total_leads_found || 0) + leadsSaved,
        next_run_at: nextRun,
        updated_at: now.toISOString(),
      })
      .eq('id', automationId);

    // Update run record
    await supabaseAdmin
      .from('robot_runs')
      .update({
        finished_at: now.toISOString(),
        status: errorMessage ? 'error' : 'success',
        leads_found: leadsFound,
        leads_saved: leadsSaved,
        error_message: errorMessage,
      })
      .eq('id', run.id);

    return new Response(
      JSON.stringify({
        success: !errorMessage,
        leadsFound,
        leadsSaved,
        error: errorMessage,
        runId: run.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in run-automation:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
