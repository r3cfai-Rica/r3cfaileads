import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    console.log("Received webhook event");

    // For now, parse the event directly (in production, use webhook signature verification)
    let event: Stripe.Event;
    
    try {
      event = JSON.parse(body) as Stripe.Event;
    } catch (err) {
      console.error("Error parsing webhook body:", err);
      return new Response("Invalid payload", { status: 400 });
    }

    console.log("Event type:", event.type);

    // Handle the checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;

      if (!userId) {
        console.error("No user ID in session metadata");
        return new Response("No user ID", { status: 400 });
      }

      console.log("Payment completed for user:", userId);

      // Create admin client for database updates
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

      // Update user's plan to 'paid'
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ plan: "paid" })
        .eq("user_id", userId);

      if (updateError) {
        console.error("Error updating user plan:", updateError);
        throw updateError;
      }

      console.log("Successfully updated user plan to 'paid'");

      // Create admin notification for upgrade
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("name, email")
        .eq("user_id", userId)
        .single();

      if (profile) {
        await supabaseAdmin.from("admin_notifications").insert({
          type: "upgrade",
          title: "Novo pagamento PRO",
          message: `${profile.name} comprou o plano PRO via Stripe.`,
          user_id: userId,
          user_name: profile.name,
          user_email: profile.email,
          metadata: {
            payment_intent: session.payment_intent,
            amount: session.amount_total,
          },
        });
        console.log("Admin notification created");
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
