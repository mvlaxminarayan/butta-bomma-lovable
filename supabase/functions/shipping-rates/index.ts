import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { QuoteInput, signQuote, type Quote } from '../_shared/shippingQuote.ts';
import { cheapestCourier, parcelGrams, FALLBACK_SHIPPING, FREE_SHIPPING_THRESHOLD } from '../_shared/shippingRules.ts';
import { shiprocket } from '../_shared/shiprocket.ts';
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
// Public, read-only guest quote endpoint: never books shipments or returns customer data.
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Use POST' }, 405);
  try {
    const parsed = QuoteInput.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: 'Enter a valid pincode and product quantities.' }, 400);
    const input = parsed.data;
    const url = Deno.env.get('SUPABASE_URL'); const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) throw new Error('Shipping configuration unavailable');
    const db = createClient(url, key, { db: { schema: 'api' }, auth: { persistSession: false } });
    const { data: products, error } = await db.from('products').select('id,price,weight_grams,specifications,in_stock,stock_quantity').in('id', input.items.map(i => i.id));
    if (error) throw error;
    const items = input.items.map(item => {
      const p = products?.find(p => p.id === item.id);
      if (!p || !p.in_stock || p.stock_quantity < item.quantity) throw new Error('An item is unavailable in this quantity.');
      return { ...p, quantity: item.quantity };
    });
    const subtotal = Math.round(items.reduce((s, i) => s + Number(i.price) * i.quantity, 0) * 100) / 100;
    let discount = 0; let freeCoupon = false; let couponCode: string | null = null;
    if (input.coupon_code) {
      const { data } = await db.rpc('validate_coupon', { _code: input.coupon_code });
      const coupon = Array.isArray(data) ? data[0] : data;
      if (coupon && subtotal >= Number(coupon.min_order)) {
        couponCode = coupon.code; freeCoupon = coupon.discount_type === 'free_shipping';
        if (coupon.discount_type === 'percent') discount = subtotal * Math.min(100, Number(coupon.discount_value)) / 100;
        if (coupon.discount_type === 'fixed') discount = Math.min(subtotal, Number(coupon.discount_value));
      }
    }
    discount = Math.round(discount * 100) / 100;
    const weight = parcelGrams(items);
    // Follow the admin's free-shipping setting so cart, checkout and announcement agree.
    const { data: settings } = await db.from('store_settings').select('free_shipping_threshold').eq('id', 1).maybeSingle();
    const freeThreshold = settings ? (settings.free_shipping_threshold == null ? null : Number(settings.free_shipping_threshold)) : FREE_SHIPPING_THRESHOLD;
    let shipping = 0; let source: Quote['source'] = 'free'; let courier_id: number | null = null; let courier: string | null = null;
    if ((freeThreshold == null || subtotal < freeThreshold) && !freeCoupon) {
      shipping = FALLBACK_SHIPPING; source = 'fallback';
      try {
        const pickups = await shiprocket('/settings/company/pickup');
        const pickup = pickups?.data?.shipping_address?.[0];
        const origin = String(pickup?.pin_code || pickup?.pincode || '518501');
        const params = new URLSearchParams({ pickup_postcode: origin, delivery_postcode: input.pincode, weight: String(weight / 1000), cod: '0', length: '25', breadth: '20', height: '10' });
        const rates = await shiprocket(`/courier/serviceability/?${params}`);
        const best = cheapestCourier(rates?.data?.available_courier_companies || []);
        if (best) { shipping = best.fee; courier_id = best.courier_id; courier = best.courier; source = 'live'; }
      } catch { /* Agreed backup keeps checkout available. */ }
    }
    const quote: Quote = { items: input.items, pincode: input.pincode, subtotal, discount, shipping, total: Math.round((subtotal - discount + shipping) * 100) / 100, weight_grams: weight, courier_id, courier, source, coupon_code: couponCode, expires: Date.now() + 10 * 60000 };
    return json({ ...quote, quote_token: await signQuote(quote) });
  } catch (e) { return json({ error: e instanceof Error ? e.message : 'Could not calculate shipping.' }, 400); }
});