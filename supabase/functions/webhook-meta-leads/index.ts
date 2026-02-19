import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VERIFY_TOKEN = "r3cf_meta_verify_2024";

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // ===== GET: Webhook Verification =====
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("Webhook verified successfully");
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  // ===== POST: Receive Lead Events =====
  if (req.method === "POST") {
    try {
      const body = await req.json();
      console.log("Webhook received:", JSON.stringify(body));

      // Verify signature if META_APP_SECRET is set
      const appSecret = Deno.env.get("META_APP_SECRET");
      // Note: For production, you should verify the X-Hub-Signature-256 header

      if (body.object !== "page") {
        return new Response("Not a page event", { status: 200, headers: corsHeaders });
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceRoleKey);

      for (const entry of body.entry || []) {
        const pageId = entry.id;

        for (const change of entry.changes || []) {
          if (change.field !== "leadgen") continue;

          const leadgenId = change.value?.leadgen_id;
          const formId = change.value?.form_id;
          const adId = change.value?.ad_id;
          const createdTime = change.value?.created_time;

          console.log(`Lead event: page=${pageId}, lead=${leadgenId}, form=${formId}`);

          // Find the meta_connection for this page
          const { data: connections, error: connError } = await supabase
            .from("meta_connections")
            .select("*")
            .eq("page_id", pageId)
            .eq("is_active", true);

          if (connError || !connections?.length) {
            console.error("No active connection for page:", pageId, connError);
            continue;
          }

          for (const conn of connections) {
            // Fetch lead data from Meta Graph API
            const accessToken = conn.page_access_token;
            const leadRes = await fetch(
              `https://graph.facebook.com/v21.0/${leadgenId}?access_token=${accessToken}`
            );

            if (!leadRes.ok) {
              const errText = await leadRes.text();
              console.error("Failed to fetch lead data:", errText);
              continue;
            }

            const leadData = await leadRes.json();
            console.log("Lead data from Meta:", JSON.stringify(leadData));

            // Parse field_data into structured lead
            const fields: Record<string, string> = {};
            for (const fd of leadData.field_data || []) {
              fields[fd.name?.toLowerCase()] = fd.values?.[0] || "";
            }

            const leadName =
              fields["full_name"] ||
              fields["nome_completo"] ||
              `${fields["first_name"] || fields["nome"] || ""} ${fields["last_name"] || fields["sobrenome"] || ""}`.trim() ||
              "Lead Meta Ads";

            const leadRecord = {
              user_id: conn.user_id,
              name: leadName,
              email: fields["email"] || null,
              phone: fields["phone_number"] || fields["telefone"] || null,
              whatsapp: fields["phone_number"] || fields["telefone"] || null,
              location: fields["city"] || fields["cidade"] || null,
              intent_signal: `Meta Lead Ad - Form ${formId || "unknown"}`,
              urgency: "high",
              status: "new",
              sources: ["meta_lead_ads"],
              tags: ["meta-ads", "auto-sync"],
            };

            // Deduplicate by email or phone
            let existing = null;
            if (leadRecord.email) {
              const { data } = await supabase
                .from("leads")
                .select("id")
                .eq("user_id", conn.user_id)
                .eq("email", leadRecord.email)
                .maybeSingle();
              existing = data;
            }
            if (!existing && leadRecord.phone) {
              const { data } = await supabase
                .from("leads")
                .select("id")
                .eq("user_id", conn.user_id)
                .eq("phone", leadRecord.phone)
                .maybeSingle();
              existing = data;
            }

            if (existing) {
              console.log("Lead already exists, skipping:", existing.id);
              continue;
            }

            const { data: savedLead, error: saveError } = await supabase
              .from("leads")
              .insert(leadRecord)
              .select()
              .single();

            if (saveError) {
              console.error("Error saving lead:", saveError);
            } else {
              console.log("Lead saved:", savedLead.id);

              // Update profile leads_used count
              await supabase.rpc("increment_messaging_usage", {
                _user_id: conn.user_id,
                _channel: "email", // just to track usage
              });
            }
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Webhook error:", error);
      return new Response(JSON.stringify({ error: "Internal error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Method not allowed", { status: 405 });
});
