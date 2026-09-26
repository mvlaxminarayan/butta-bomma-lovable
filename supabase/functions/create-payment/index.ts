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
    console.log("Create payment function started - timestamp:", new Date().toISOString());
    
    const origin = req.headers.get("origin") || "";
    console.log("Origin:", origin);
    
    const body = (await req.json().catch(() => ({}))) as {
      product?: string; amount?: number; subtotal?: number; couponCode?: string; currency?: string;
    };
    const product = String(body.product || "Order").slice(0, 200);
    const currency = "usd";
    const amount = body.amount ?? 99;
    let finalAmount = Math.round(Number(amount));

    // Recompute shipping + discounts on the server so coupons can't be faked
    if (typeof body.subtotal === "number" && body.subtotal >= 0) {
      const admin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      ).schema("api");
      const subtotal = body.subtotal;
      const { data: s } = await admin.from("store_settings").select("*").eq("id", 1).maybeSingle();
      const fee = s ? Number(s.shipping_fee) : 8.99;
      const threshold = s?.free_shipping_threshold == null ? null : Number(s.free_shipping_threshold);
      let discount = 0;
      let freeShip = threshold != null && subtotal >= threshold;
      const code = String(body.couponCode || "").trim().slice(0, 40);
      if (code) {
        const { data: rows } = await admin.rpc("validate_coupon", { _code: code });
        const c = Array.isArray(rows) ? rows[0] : rows;
        if (!c || subtotal < Number(c.min_order)) throw new Error("Coupon is not valid for this order");
        const v = Number(c.discount_value);
        if (c.discount_type === "percent") discount = subtotal * Math.min(v, 100) / 100;
        if (c.discount_type === "fixed") discount = Math.min(v, subtotal);
        if (c.discount_type === "free_shipping") freeShip = true;
        const { data: row } = await admin.from("coupons").select("id,times_used").ilike("code", c.code).maybeSingle();
        if (row) await admin.from("coupons").update({ times_used: row.times_used + 1 }).eq("id", row.id);
      }
      discount = Math.round(discount * 100) / 100;
      finalAmount = Math.round((Math.max(0, subtotal - discount) + (freeShip ? 0 : fee)) * 100);
    }
    if (finalAmount < 50) throw new Error("Order total must be at least $0.50");
    console.log("Request body parsed:", { product, finalAmount });

    // Check if Stripe key exists
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey || stripeKey.trim() === "") {
      console.error("STRIPE_SECRET_KEY not found or empty in environment");
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
            unit_amount: finalAmount, // cents, recomputed on the server
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
