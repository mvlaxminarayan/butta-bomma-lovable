import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
const TTL = 60 * 60 * 24 * 7

// Signs only photos the store actually displays (product photos, story photo); admins may sign any product-images path.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const body = await req.json().catch(() => ({}))
    const paths: string[] = Array.isArray(body?.paths)
      ? [...new Set(body.paths.filter((p: unknown) => typeof p === 'string' && p.length > 0 && p.length < 300 && !p.includes('..')))].slice(0, 200) as string[]
      : []
    if (!paths.length) return json({ urls: {} })
    const url = Deno.env.get('SUPABASE_URL')!
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { db: { schema: 'api' }, auth: { persistSession: false } })

    let isAdmin = false
    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
    if (token) {
      const { data } = await admin.auth.getUser(token)
      if (data?.user) {
        const { data: prof } = await admin.from('profiles').select('role').eq('user_id', data.user.id).maybeSingle()
        isAdmin = prof?.role === 'admin'
      }
    }

    let allowed = paths
    if (!isAdmin) {
      const known = new Set<string>()
      // Page through all products; the Data API caps each response at 1,000 rows.
      for (let offset = 0; ; offset += 1000) {
        const { data: products, error } = await admin.from('products').select('images, image_url').order('id').range(offset, offset + 999)
        if (error) throw error
        products?.forEach((p: { images: string[] | null; image_url: string | null }) => {
          (p.images || []).forEach((i) => known.add(i))
          if (p.image_url) known.add(p.image_url)
        })
        if (!products || products.length < 1000) break
      }
      const { data: s, error: settingsError } = await admin.from('store_settings').select('story_image').eq('id', 1).maybeSingle()
      if (settingsError) throw settingsError
      if (s?.story_image) known.add(s.story_image)
      allowed = paths.filter((p) => known.has(p))
    }
    if (!allowed.length) return json({ urls: {} })
    const { data, error } = await admin.storage.from('product-images').createSignedUrls(allowed, TTL)
    if (error) return json({ error: 'Could not load photos.' }, 500)
    const urls: Record<string, string> = {}
    data?.forEach((d) => { if (d.path && d.signedUrl) urls[d.path] = d.signedUrl })
    return json({ urls })
  } catch (_e) {
    return json({ error: 'Could not load photos.' }, 500)
  }
})
