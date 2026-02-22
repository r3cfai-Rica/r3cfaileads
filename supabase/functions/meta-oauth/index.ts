import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const { code, redirect_uri } = await req.json();

    if (!code) {
      return new Response(JSON.stringify({ error: "Missing code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const appId = Deno.env.get("META_APP_ID")!;
    const appSecret = Deno.env.get("META_APP_SECRET")!;

    // Step 1: Exchange code for short-lived user access token
    const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirect_uri)}&client_secret=${appSecret}&code=${code}`;

    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error("Token exchange error:", tokenData.error);
      return new Response(JSON.stringify({ error: tokenData.error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const shortLivedToken = tokenData.access_token;

    // Step 2: Exchange for long-lived token
    const longLivedUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`;

    const longLivedRes = await fetch(longLivedUrl);
    const longLivedData = await longLivedRes.json();

    if (longLivedData.error) {
      console.error("Long-lived token error:", longLivedData.error);
      return new Response(JSON.stringify({ error: longLivedData.error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const longLivedUserToken = longLivedData.access_token;

    // Step 3: Get pages the user manages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${longLivedUserToken}&fields=id,name,access_token`
    );
    const pagesData = await pagesRes.json();

    if (pagesData.error) {
      console.error("Pages fetch error:", pagesData.error);
      return new Response(JSON.stringify({ error: pagesData.error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pages = pagesData.data || [];

    if (pages.length === 0) {
      return new Response(
        JSON.stringify({ error: "No pages found. You need to manage at least one Facebook page." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 4: Save page connections using service role (page access tokens are long-lived by default)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const savedPages = [];
    for (const page of pages) {
      // Subscribe to leadgen webhook for this page
      try {
        const subscribeRes = await fetch(
          `https://graph.facebook.com/v21.0/${page.id}/subscribed_apps`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subscribed_fields: ["leadgen"],
              access_token: page.access_token,
            }),
          }
        );
        const subscribeData = await subscribeRes.json();
        console.log(`Subscribed page ${page.id}:`, subscribeData);
      } catch (e) {
        console.error(`Error subscribing page ${page.id}:`, e);
      }

      // Upsert connection
      const { data, error } = await supabaseAdmin
        .from("meta_connections")
        .upsert(
          {
            user_id: userId,
            page_id: page.id,
            page_name: page.name,
            page_access_token: page.access_token,
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,page_id" }
        )
        .select()
        .single();

      if (error) {
        console.error("Error saving page connection:", error);
      } else {
        savedPages.push({ id: data.id, page_id: page.id, page_name: page.name });
      }
    }

    return new Response(
      JSON.stringify({ success: true, pages: savedPages }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Meta OAuth error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
