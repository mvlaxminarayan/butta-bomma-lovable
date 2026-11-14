import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { verifyQuote } from '../_shared/shippingQuote.ts'

// Creates a Razorpay order for the cart total (in paise) and returns
// the order id + publishable key id so the browser can open checkout.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    const keyId = Deno.env.get('RAZORPAY_KEY_ID')
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!keyId || !keySecret) {
      return json({ error: 'Razorpay is not configured yet.' }, 500)
    }

    const body = await req.json().catch(() => ({}))
    if (typeof body.quote_token !== 'string' || body.quote_token.length > 20000) return json({ error: 'Refresh your shipping charge before payment.' }, 400)
    let quote;
    try { quote = await verifyQuote(body.quote_token) }
    catch (error) { return json({ error: error instanceof Error ? error.message : 'Invalid shipping quote' }, 400) }
    const amountRupees = quote.total
    const product = typeof body?.product === 'string' ? body.product.slice(0, 120) : 'Order'

    if (!Number.isFinite(amountRupees) || amountRupees <= 0 || amountRupees > 10_000_000) {
      return json({ error: 'Invalid order amount.' }, 400)
    }

    const amountPaise = Math.round(amountRupees * 100)
    if (amountPaise < 100) {
      return json({ error: 'Order total must be at least ₹1.' }, 400)
    }

    const auth = btoa(`${keyId}:${keySecret}`)
    const rpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`,
        notes: {
          product,
          shipping_fee: String(quote.shipping),
          subtotal: String(quote.subtotal), discount: String(quote.discount),
          shipping_weight_grams: String(quote.weight_grams),
          courier_id: String(quote.courier_id || ''),
          shipping_pincode: quote.pincode,
          coupon_code: quote.coupon_code || '',
          cart_fingerprint: Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(quote.items))))).map(b => b.toString(16).padStart(2, '0')).join(''),
        },
      }),
    })

    const order = await rpRes.json()
    if (!rpRes.ok) {
      console.error('Razorpay error:', order)
      return json({ error: order?.error?.description || 'Could not create the payment order.' }, 502)
    }

    return json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId })
  } catch (err) {
    console.error('create-razorpay-order failed:', err)
    return json({ error: 'Unexpected error creating the payment order.' }, 500)
  }
})
