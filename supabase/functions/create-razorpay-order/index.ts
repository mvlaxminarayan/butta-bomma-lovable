import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

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
    const amountRupees = Number(body?.amount)
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
        notes: { product },
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
