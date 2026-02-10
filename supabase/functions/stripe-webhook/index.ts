import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      console.error("Missing stripe-signature header");
      return new Response("Missing signature", { status: 400 });
    }

    const body = await req.text();

    // Verify webhook signature cryptographically
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response("Invalid signature", { status: 400 });
    }

    console.log("Verified event type:", event.type);

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

    // Handle the checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      const planType = session.metadata?.plan_type || 'basic';
      const setupSubscription = session.metadata?.setup_subscription === 'true';

      if (!userId) {
        console.error("No user ID in session metadata");
        return new Response("No user ID", { status: 400 });
      }

      console.log("Payment completed for user:", userId, "Plan:", planType);

      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ 
          plan: "paid",
          plan_type: planType
        })
        .eq("user_id", userId);

      if (updateError) {
        console.error("Error updating user plan:", updateError);
        throw updateError;
      }

      console.log(`Successfully updated user plan to 'paid' with type '${planType}'`);

      if (planType === 'premium') {
        const { error: usageError } = await supabaseAdmin
          .from("user_messaging_usage")
          .upsert({
            user_id: userId,
            whatsapp_limit: 500,
            sms_limit: 100,
            email_limit: 5000,
            whatsapp_used: 0,
            sms_used: 0,
            email_used: 0,
            billing_cycle_start: new Date().toISOString(),
          }, {
            onConflict: 'user_id'
          });

        if (usageError) {
          console.error("Error setting up messaging usage:", usageError);
        } else {
          console.log("Messaging usage limits set for premium user");
        }

        if (setupSubscription) {
          try {
            const customers = await stripe.customers.list({
              limit: 1,
              expand: ['data.subscriptions'],
            });

            const customer = customers.data.find((c: Stripe.Customer) => 
              c.metadata?.supabase_user_id === userId
            );

            if (customer) {
              const nextMonth = new Date();
              nextMonth.setMonth(nextMonth.getMonth() + 1);
              nextMonth.setDate(1);

              const price = await stripe.prices.create({
                unit_amount: 35000,
                currency: 'brl',
                recurring: { interval: 'month' },
                product_data: {
                  name: 'LeadPilot Premium - Mensalidade',
                },
              });

              const subscription = await stripe.subscriptions.create({
                customer: customer.id,
                items: [{ price: price.id }],
                billing_cycle_anchor: Math.floor(nextMonth.getTime() / 1000),
                proration_behavior: 'none',
                metadata: {
                  supabase_user_id: userId,
                  plan_type: 'premium',
                },
              });

              console.log("Created recurring subscription:", subscription.id);
            }
          } catch (subError) {
            console.error("Error creating subscription:", subError);
          }
        }
      }

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("name, email")
        .eq("user_id", userId)
        .single();

      if (profile) {
        const planLabel = planType === 'premium' ? 'Premium' : 'Básico';
        const amount = planType === 'premium' ? 'R$500' : 'R$150';
        
        await supabaseAdmin.from("admin_notifications").insert({
          type: "upgrade",
          title: `Novo pagamento - Plano ${planLabel}`,
          message: `${profile.name} comprou o plano ${planLabel} (${amount}).`,
          user_id: userId,
          metadata: {
            payment_intent: session.payment_intent,
            amount: session.amount_total,
            plan_type: planType,
          },
        });
        console.log("Admin notification created");
      }
    }

    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      
      const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
      const userId = customer.metadata?.supabase_user_id;

      if (userId && invoice.billing_reason === 'subscription_cycle') {
        console.log("Recurring payment received for user:", userId);
        
        const { error: resetError } = await supabaseAdmin
          .from("user_messaging_usage")
          .update({
            whatsapp_used: 0,
            sms_used: 0,
            email_used: 0,
            billing_cycle_start: new Date().toISOString(),
          })
          .eq("user_id", userId);

        if (resetError) {
          console.error("Error resetting usage:", resetError);
        } else {
          console.log("Monthly usage reset for premium user");
        }
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.supabase_user_id;

      if (userId) {
        console.log("Subscription cancelled for user:", userId);
        
        await supabaseAdmin
          .from("profiles")
          .update({ plan_type: 'basic' })
          .eq("user_id", userId);

        await supabaseAdmin
          .from("user_messaging_usage")
          .update({
            whatsapp_limit: 0,
            sms_limit: 0,
            email_limit: 0,
          })
          .eq("user_id", userId);

        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("name, email")
          .eq("user_id", userId)
          .single();

        if (profile) {
          await supabaseAdmin.from("admin_notifications").insert({
            type: "cancellation",
            title: "Assinatura Premium cancelada",
            message: `${profile.name} cancelou a assinatura Premium. Mantém acesso Básico.`,
            user_id: userId,
            metadata: {
              user_name: profile.name,
              user_email: profile.email,
            },
          });
        }
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