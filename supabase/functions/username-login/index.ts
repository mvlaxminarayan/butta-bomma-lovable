import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const { username, password } = await req.json().catch(() => ({}))
    const u = String(username || '').trim().toLowerCase()
    if (!/^[a-z0-9_]{3,20}$/.test(u) || !password) return json({ error: 'Wrong username or password.' }, 400)
    const url = Deno.env.get('SUPABASE_URL')!
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { db: { schema: 'api' }, auth: { persistSession: false } })
    const { data: prof } = await admin.from('profiles').select('email').ilike('username', u).maybeSingle()
    if (!prof?.email) return json({ error: 'Wrong username or password.' }, 401)
    const anon = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { auth: { persistSession: false } })
    const { data, error } = await anon.auth.signInWithPassword({ email: prof.email, password: String(password) })
    if (error || !data.session) {
      const msg = error?.message?.toLowerCase().includes('confirm') ? 'Please confirm your email first.' : 'Wrong username or password.'
      return json({ error: msg }, 401)
    }
    return json({ access_token: data.session.access_token, refresh_token: data.session.refresh_token })
  } catch (_e) {
    return json({ error: 'Sign-in failed. Please try again.' }, 500)
  }
})
