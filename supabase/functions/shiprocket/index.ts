import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

// Admin-only Shiprocket actions:
//  - ship:  create Shiprocket order, assign courier, save AWB + courier, mark shipped
//  - label: get printable label URL for a shipped order
const SR = 'https://apiv2.shiprocket.in/v1/external'
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

let cachedToken: { token: string; exp: number } | null = null
async function srToken() {
  if (cachedToken && cachedToken.exp > Date.now()) return cachedToken.token
  const res = await fetch(`${SR}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: Deno.env.get('SHIPROCKET_API_EMAIL'), password: Deno.env.get('SHIPROCKET_API_PASSWORD') }),
  })
  const d = await res.json().catch(() => ({}))
  if (!res.ok || !d.token) throw new Error(`Shiprocket login failed: ${d.message || res.status}`)
  cachedToken = { token: d.token, exp: Date.now() + 8 * 24 * 3600 * 1000 }
  return d.token as string
}
async function sr(path: string, method = 'GET', body?: unknown) {
  const token = await srToken()
  const res = await fetch(`${SR}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  })
  const d = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(d.message || JSON.stringify(d.errors || d).slice(0, 300))
  return d
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const db = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { db: { schema: 'api' }, auth: { persistSession: false } })

    const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '')
    const { data: u } = await db.auth.getUser(jwt)
    if (!u?.user) return json({ error: 'Sign in required.' }, 401)
    const { data: prof } = await db.from('profiles').select('role').eq('user_id', u.user.id).maybeSingle()
    if (prof?.role !== 'admin') return json({ error: 'Admins only.' }, 403)

    const body = await req.json().catch(() => ({}))
    const action = String(body?.action || '')
    const orderId = String(body?.order_id || '')
    if (!/^[0-9a-f-]{36}$/i.test(orderId)) return json({ error: 'Invalid order.' }, 400)
    const { data: o } = await db.from('orders').select('*').eq('id', orderId).maybeSingle()
    if (!o) return json({ error: 'Order not found.' }, 404)

    if (action === 'label') {
      const shipmentId = o.status_history?.find?.((h: any) => h.shiprocket_shipment_id)?.shiprocket_shipment_id
      if (!shipmentId) return json({ error: 'No Shiprocket shipment for this order.' }, 400)
      const d = await sr('/courier/generate/label', 'POST', { shipment_id: [shipmentId] })
      return json({ label_url: d.label_url })
    }

    if (action !== 'ship') return json({ error: 'Unknown action.' }, 400)
    if (o.tracking_number) return json({ error: 'This order already has a tracking number.' }, 400)
    const a = o.shipping_address || {}
    if (!a.address || !a.city || !a.zip || !o.phone) return json({ error: 'Order is missing address, pincode or phone.' }, 400)

    const pickups = await sr('/settings/company/pickup')
    const pickup = pickups?.data?.shipping_address?.[0]?.pickup_location
    if (!pickup) return json({ error: 'Add a pickup address in Shiprocket Settings first.' }, 400)

    const items = (o.items || []) as { id: string; name: string; price: number; quantity: number }[]
    const totalQty = items.reduce((s, i) => s + i.quantity, 0) || 1
    const [first, ...rest] = String(o.customer_name || 'Customer').split(' ')
    const created = await sr('/orders/create/adhoc', 'POST', {
      order_id: o.order_number,
      order_date: new Date(o.created_at).toISOString().slice(0, 16).replace('T', ' '),
      pickup_location: pickup,
      billing_customer_name: first,
      billing_last_name: rest.join(' ') || '.',
      billing_address: a.address,
      billing_city: a.city,
      billing_pincode: String(a.zip),
      billing_state: a.state || '',
      billing_country: a.country || 'India',
      billing_email: o.email || 'support@buttabommacrafts.com',
      billing_phone: String(o.phone).replace(/\D/g, '').slice(-10),
      shipping_is_billing: true,
      order_items: items.map((i) => ({ name: i.name, sku: i.id.slice(0, 20), units: i.quantity, selling_price: i.price })),
      payment_method: 'Prepaid',
      shipping_charges: Number(o.shipping_fee) || 0,
      total_discount: Number(o.discount) || 0,
      sub_total: Number(o.subtotal) || Number(o.total),
      length: 25, breadth: 20, height: 10,
      weight: Math.min(20, 0.5 * totalQty),
    })
    const shipmentId = created.shipment_id
    if (!shipmentId) return json({ error: `Shiprocket did not create a shipment: ${created.message || ''}` }, 502)

    const awb = await sr('/courier/assign/awb', 'POST', { shipment_id: shipmentId })
    const r = awb?.response?.data
    if (!r?.awb_code) return json({ error: `Courier not assigned: ${awb?.message || 'check wallet balance / KYC in Shiprocket'}` }, 502)

    // Request pickup (best effort)
    await sr('/courier/generate/pickup', 'POST', { shipment_id: [shipmentId] }).catch(() => null)

    const history = [...(o.status_history || []), { shiprocket_shipment_id: shipmentId, shiprocket_order_id: created.order_id, at: new Date().toISOString() }]
    const { data: updated, error } = await db.from('orders')
      .update({ courier: r.courier_name, tracking_number: r.awb_code, status: 'shipped', status_history: history })
      .eq('id', o.id).select('*').maybeSingle()
    if (error) return json({ error: error.message }, 500)
    return json({ order: updated })
  } catch (e) {
    return json({ error: (e as Error).message }, 500)
  }
})
