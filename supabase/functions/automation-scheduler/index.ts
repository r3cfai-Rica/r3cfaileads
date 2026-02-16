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
    const now = new Date().toISOString();

    // Find automations due to run
    const { data: dueAutomations, error } = await supabaseAdmin
      .from('automations')
      .select('id, name, end_date')
      .eq('is_active', true)
      .lte('next_run_at', now)
      .not('next_run_at', 'is', null);

    if (error) {
      console.error('Error fetching due automations:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Filter out expired automations
    const validAutomations = (dueAutomations || []).filter(a => {
      if (a.end_date && new Date(a.end_date) < new Date()) {
        return false;
      }
      return true;
    });

    console.log(`Scheduler: ${validAutomations.length} automations due to run`);

    const results = [];

    for (const automation of validAutomations) {
      try {
        // Call run-automation function
        const resp = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/run-automation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({ automationId: automation.id, triggeredBy: 'scheduler' }),
        });

        const result = await resp.json();
        results.push({ id: automation.id, name: automation.name, ...result });
        console.log(`Automation "${automation.name}" completed: ${result.leadsSaved} leads saved`);
      } catch (e) {
        console.error(`Failed to run automation "${automation.name}":`, e);
        results.push({ id: automation.id, name: automation.name, error: String(e) });
      }
    }

    return new Response(
      JSON.stringify({ ran: results.length, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Scheduler error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
