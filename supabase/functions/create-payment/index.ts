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

  // Create Supabase client using anon key (for optional auth context)
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    console.log("Create payment function started");
    
    const origin = req.headers.get("origin") || "";
    console.log("Origin:", origin);
    
    const { product = "Handcrafted Ceramic Mug", amount = 99, currency = "usd" } =
      (await req.json().catch(() => ({}))) as { product?: string; amount?: number; currency?: string };
    console.log("Request body parsed:", { product, amount, currency });

    // Check if Stripe key exists
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    console.log("All env vars:", Object.keys(Deno.env.toObject()));
    console.log("Checking STRIPE_SECRET_KEY:", stripeKey ? "found" : "not found");
    if (!stripeKey) {
      console.error("STRIPE_SECRET_KEY not found in environment");
      console.error("Available env vars:", Object.keys(Deno.env.toObject()));
      throw new Error("Stripe configuration error");
    }
    console.log("Stripe key found:", stripeKey.substring(0, 10) + "...");

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });
    console.log("Stripe initialized");

    // Try to get authenticated user; fallback to guest
    const authHeader = req.headers.get("Authorization");
    let email = "guest@example.com";
    if (authHeader) {
      console.log("Auth header found, getting user");
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      if (data.user?.email) {
        email = data.user.email;
        console.log("User authenticated:", email);
      }
    } else {
      console.log("No auth header, using guest email");
    }

    // Reuse Stripe customer if email exists
    let customerId: string | undefined;
    if (email && email !== "guest@example.com") {
      console.log("Checking for existing Stripe customer");
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        console.log("Found existing customer:", customerId);
      }
    }

    console.log("Creating Stripe checkout session");
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: [
        {
          price_data: {
            currency,
            product_data: { name: product },
            unit_amount: amount, // amount is in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      shipping_address_collection: { allowed_countries: ["US"] },
      success_url: `${origin}/payment-success`,
      cancel_url: `${origin}/payment-canceled`,
    });

    console.log("Checkout session created:", session.id);
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in create-payment function:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
