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
    console.log("SUPABASE url",Deno.env.get("SUPABASE_URL"))
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const origin = req.headers.get("origin") || "";
    const { product = "Handcrafted Ceramic Mug", amount = 99, currency = "usd" } =
      (await req.json().catch(() => ({}))) as { product?: string; amount?: number; currency?: string };

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Try to get authenticated user; fallback to guest
    const authHeader = req.headers.get("Authorization");
    let email = "guest@example.com";
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      if (data.user?.email) email = data.user.email;
    }

    // Reuse Stripe customer if email exists
    let customerId: string | undefined;
    if (email && email !== "guest@example.com") {
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length > 0) customerId = customers.data[0].id;
    }

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

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
