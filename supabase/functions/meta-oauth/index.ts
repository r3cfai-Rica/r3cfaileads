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
    console.log("meta-oauth: received request", req.method);

    const authHeader = req.headers.get("Authorization");
    console.log("meta-oauth: auth header present:", !!authHeader);
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("meta-oauth: REJECTED - missing or invalid auth header");
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
      console.log("meta-oauth: getUser FAILED:", userError?.message || "no user");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.log("meta-oauth: authenticated user", user.id);
    const userId = user.id;

    const body = await req.json();
    const { code, redirect_uri } = body;
    console.log("meta-oauth: received code length:", code?.length, "redirect_uri:", redirect_uri);

    if (!code) {
      console.log("meta-oauth: REJECTED - missing code");
      return new Response(JSON.stringify({ error: "Missing code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const appId = Deno.env.get("META_APP_ID")!;
    const appSecret = Deno.env.get("META_APP_SECRET")!;
    console.log("meta-oauth: appId present:", !!appId, "appSecret present:", !!appSecret);

    // Step 1: Exchange code for short-lived user access token
    const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirect_uri)}&client_secret=${appSecret}&code=${code}`;
    console.log("meta-oauth: Step 1 - exchanging code for token...");

    const tokenRes = await fetch(tokenUrl);
    const tokenText = await tokenRes.text();
    console.log("meta-oauth: Step 1 response status:", tokenRes.status, "body:", tokenText);

    let tokenData;
    try {
      tokenData = JSON.parse(tokenText);
    } catch {
      console.log("meta-oauth: Step 1 FAILED - could not parse response");
      return new Response(JSON.stringify({ error: "Invalid response from Facebook token exchange" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (tokenData.error) {
      console.log("meta-oauth: Step 1 FAILED -", tokenData.error.message);
      return new Response(JSON.stringify({ error: tokenData.error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const shortLivedToken = tokenData.access_token;
    console.log("meta-oauth: Step 1 SUCCESS - got short-lived token");

    // Step 2: Exchange for long-lived token
    const longLivedUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`;
    console.log("meta-oauth: Step 2 - exchanging for long-lived token...");

    const longLivedRes = await fetch(longLivedUrl);
    const longLivedText = await longLivedRes.text();
    console.log("meta-oauth: Step 2 response status:", longLivedRes.status, "body:", longLivedText);

    let longLivedData;
    try {
      longLivedData = JSON.parse(longLivedText);
    } catch {
      console.log("meta-oauth: Step 2 FAILED - could not parse response");
      return new Response(JSON.stringify({ error: "Invalid response from Facebook long-lived token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (longLivedData.error) {
      console.log("meta-oauth: Step 2 FAILED -", longLivedData.error.message);
      return new Response(JSON.stringify({ error: longLivedData.error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const longLivedUserToken = longLivedData.access_token;
    console.log("meta-oauth: Step 2 SUCCESS - got long-lived token");

    // Step 3: Get pages the user manages
    console.log("meta-oauth: Step 3 - fetching pages...");
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${longLivedUserToken}&fields=id,name,access_token`
    );
    const pagesText = await pagesRes.text();
    console.log("meta-oauth: Step 3 response status:", pagesRes.status, "body:", pagesText);

    let pagesData;
    try {
      pagesData = JSON.parse(pagesText);
    } catch {
      console.log("meta-oauth: Step 3 FAILED - could not parse response");
      return new Response(JSON.stringify({ error: "Invalid response from Facebook pages" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (pagesData.error) {
      console.log("meta-oauth: Step 3 FAILED -", pagesData.error.message);
      return new Response(JSON.stringify({ error: pagesData.error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pages = pagesData.data || [];
    console.log("meta-oauth: Step 3 SUCCESS - found", pages.length, "pages");

    if (pages.length === 0) {
      return new Response(
        JSON.stringify({ error: "No pages found. You need to manage at least one Facebook page." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 4: Save page connections
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const savedPages = [];

    for (const page of pages) {
      console.log("meta-oauth: Step 4 - processing page", page.id, page.name);

      // Subscribe to leadgen webhook
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
        const subscribeText = await subscribeRes.text();
        console.log("meta-oauth: subscribed page", page.id, "status:", subscribeRes.status, "body:", subscribeText);
      } catch (e) {
        console.log("meta-oauth: error subscribing page", page.id, ":", e.message);
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
        console.log("meta-oauth: error saving page", page.id, ":", error.message);
      } else {
        console.log("meta-oauth: saved page", page.id, "successfully");
        savedPages.push({ id: data.id, page_id: page.id, page_name: page.name });
      }
    }

    console.log("meta-oauth: DONE - saved", savedPages.length, "pages");
    return new Response(
      JSON.stringify({ success: true, pages: savedPages }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.log("meta-oauth: UNHANDLED ERROR:", error.message);
    return new Response(JSON.stringify({ error: error.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
