import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckoutRequest {
  planType: 'basic' | 'premium';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.error("User authentication failed:", userError);
      throw new Error("User not authenticated");
    }

    // Parse request body for plan type
    let planType: 'basic' | 'premium' = 'basic';
    try {
      const body: CheckoutRequest = await req.json();
      planType = body.planType || 'basic';
    } catch {
      // Default to basic if no body
      planType = 'basic';
    }

    console.log("Creating checkout for user:", user.id, user.email, "Plan:", planType);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if customer already exists
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("Found existing Stripe customer:", customerId);
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;
      console.log("Created new Stripe customer:", customerId);
    }

    // Get origin from request or use default
    const origin = req.headers.get("origin") || "https://gylxzoogrqqeqihqknkm.lovableproject.com";

    let session: Stripe.Checkout.Session;

    if (planType === 'basic') {
      // Basic Plan: R$150 one-time payment
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
          {
            price_data: {
              currency: "brl",
              product_data: {
                name: "LeadPilot Básico",
                description: "Acesso vitalício - Configure suas próprias APIs",
              },
              unit_amount: 15000, // R$ 150,00 in centavos
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${origin}/payment-success?plan=basic`,
        cancel_url: `${origin}/plans?payment=cancelled`,
        metadata: {
          supabase_user_id: user.id,
          plan_type: 'basic',
        },
      });
    } else {
      // Premium Plan: R$500 first payment (R$150 setup + R$350 first month)
      // Then R$350/month subscription
      // For the first payment, we use a one-time charge of R$500
      // and set up the subscription starting next month
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
          // Setup fee + first month
          {
            price_data: {
              currency: "brl",
              product_data: {
                name: "LeadPilot Premium - Adesão + 1º Mês",
                description: "Taxa de adesão R$150 + Primeira mensalidade R$350",
              },
              unit_amount: 50000, // R$ 500,00 in centavos
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${origin}/payment-success?plan=premium`,
        cancel_url: `${origin}/plans?payment=cancelled`,
        metadata: {
          supabase_user_id: user.id,
          plan_type: 'premium',
          // Flag to set up recurring subscription after first payment
          setup_subscription: 'true',
        },
      });
    }

    console.log("Checkout session created:", session.id);

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
