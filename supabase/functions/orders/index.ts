import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

// Orders API:
//  - create:   verify a Razorpay payment signature and record the order
//  - shipping: attach shipping details (proved by the payment id)
//  - track:    guest lookup by order number + email
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

async function hmacHex(secret: string, msg: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function newOrderNumber() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(7))
  return 'BB-' + [...bytes].map((b) => chars[b % chars.length]).join('')
}

const publicOrder = (o: any) => ({
  order_number: o.order_number,
  status: o.status,
  items: o.items,
  subtotal: o.subtotal,
  shipping_fee: o.shipping_fee,
  discount: o.discount,
  total: o.total,
  courier: o.courier,
  tracking_number: o.tracking_number,
  status_history: o.status_history,
  customer_name: o.customer_name,
  shipping_address: o.shipping_address,
  created_at: o.created_at,
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const db = createClient(url, serviceKey, { db: { schema: 'api' }, auth: { persistSession: false } })
    const body = await req.json().catch(() => ({}))
    const action = str(body?.action, 20)

    if (action === 'create') {
      const keyId = Deno.env.get('RAZORPAY_KEY_ID')
      const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
      if (!keyId || !keySecret) return json({ error: 'Payments not configured.' }, 500)

      const rzOrderId = str(body.razorpay_order_id, 100)
      const rzPaymentId = str(body.razorpay_payment_id, 100)
      const rzSig = str(body.razorpay_signature, 200)
      if (!rzOrderId || !rzPaymentId || !rzSig) return json({ error: 'Missing payment details.' }, 400)

      const expected = await hmacHex(keySecret, `${rzOrderId}|${rzPaymentId}`)
      if (expected !== rzSig) return json({ error: 'Payment could not be verified.' }, 400)

      // Idempotent: return the existing order if already recorded
      const { data: existing } = await db.from('orders').select('order_number').eq('razorpay_order_id', rzOrderId).maybeSingle()
      if (existing) return json({ order_number: existing.order_number })

      // Amount actually paid, from Razorpay
      const rpRes = await fetch(`https://api.razorpay.com/v1/orders/${rzOrderId}`, {
        headers: { Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}` },
      })
      const rpOrder = await rpRes.json()
      if (!rpRes.ok) return json({ error: 'Could not confirm payment amount.' }, 502)
      const total = Number(rpOrder.amount) / 100

      // Items priced from the database, not the browser
      const rawItems = Array.isArray(body.items) ? body.items.slice(0, 50) : []
      const ids = rawItems.map((i: any) => str(i?.id, 64)).filter(Boolean)
      const { data: products } = ids.length
        ? await db.from('products').select('id,name,price').in('id', ids)
        : { data: [] as any[] }
      const items = rawItems
        .map((i: any) => {
          const p = products?.find((x: any) => x.id === i.id)
          const qty = Math.max(1, Math.min(99, Math.floor(Number(i?.quantity) || 1)))
          return p ? { id: p.id, name: p.name, price: Number(p.price), quantity: qty } : null
        })
        .filter(Boolean) as { price: number; quantity: number }[]
      const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
      const shippingFee = Math.max(0, Number(body.shipping_fee) || 0)
      const discount = Math.max(0, Math.round((subtotal + shippingFee - total) * 100) / 100)

      // Link to the signed-in customer (from their verified token only)
      let userId: string | null = null
      let email: string | null = null
      const token = req.headers.get('Authorization')?.replace('Bearer ', '')
      if (token) {
        const { data } = await db.auth.getUser(token)
        if (data?.user) { userId = data.user.id; email = data.user.email ?? null }
      }

      // Delivery details collected before payment
      const c = body.customer ?? {}
      const ca = c.address ?? {}
      const customerName = str(c.name, 120) || null
      const customerEmail = str(c.email, 255).toLowerCase() || null
      const shippingAddress = str(ca.address, 300)
        ? {
            address: str(ca.address, 300), city: str(ca.city, 100), state: str(ca.state, 100),
            zip: str(ca.zip, 20), country: str(ca.country, 60) || 'India',
            instructions: str(ca.instructions, 500),
          }
        : null

      const order_number = newOrderNumber()
      const { error } = await db.from('orders').insert({
        order_number,
        user_id: userId,
        email: customerEmail ?? email,
        customer_name: customerName,
        phone: str(c.phone, 30) || null,
        shipping_address: shippingAddress,
        items,
        subtotal,
        shipping_fee: shippingFee,
        discount,
        total,
        coupon_code: str(body.coupon_code, 40) || null,
        status: 'paid',
        status_history: [{ status: 'paid', at: new Date().toISOString() }],
        razorpay_order_id: rzOrderId,
        razorpay_payment_id: rzPaymentId,
      })
      if (error) { console.error(error); return json({ error: 'Could not save order.' }, 500) }
      return json({ order_number })
    }


    if (action === 'shipping') {
      const orderNumber = str(body.order_number, 20).toUpperCase()
      const paymentId = str(body.payment_id, 100)
      const email = str(body.email, 255).toLowerCase()
      const name = str(body.name, 120)
      if (!orderNumber || !paymentId || !email.includes('@') || !name) return json({ error: 'Missing details.' }, 400)
      const a = body.address ?? {}
      const address = {
        address: str(a.address, 300), city: str(a.city, 100), state: str(a.state, 100),
        zip: str(a.zip, 20), country: str(a.country, 60), instructions: str(a.instructions, 500),
      }
      const { data, error } = await db.from('orders')
        .update({ email, customer_name: name, phone: str(body.phone, 30), shipping_address: address })
        .eq('order_number', orderNumber).eq('razorpay_payment_id', paymentId)
        .select('order_number').maybeSingle()
      if (error || !data) return json({ error: 'Order not found.' }, 404)
      return json({ ok: true })
    }

    if (action === 'track') {
      const orderNumber = str(body.order_number, 20).toUpperCase()
      const email = str(body.email, 255).toLowerCase()
      if (!orderNumber || !email) return json({ error: 'Enter your order number and email.' }, 400)
      const { data } = await db.from('orders').select('*').eq('order_number', orderNumber).maybeSingle()
      if (!data || (data.email ?? '').toLowerCase() !== email) {
        return json({ error: 'No order found with that number and email.' }, 404)
      }
      return json({ order: publicOrder(data) })
    }

    return json({ error: 'Unknown action.' }, 400)
  } catch (err) {
    console.error('orders failed:', err)
    return json({ error: 'Unexpected error.' }, 500)
  }
})
