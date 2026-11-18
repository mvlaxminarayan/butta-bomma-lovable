type LinkStore = Pick<Storage, "getItem" | "setItem">;

/** Reusable photo links per signed-in identity; create a fresh resolver when the identity changes.
 *  Optional storage keeps links across visits so browsers can reuse cached photo downloads. */
export function createPhotoResolver(
  sign: (paths: string[]) => Promise<Record<string, string>>,
  now: () => number = Date.now,
  opts: { ttlMs?: number; storage?: LinkStore; storageKey?: string } = {},
) {
  const ttl = opts.ttlMs ?? 5 * 60 * 1000;
  const key = opts.storageKey ?? "photo-links";
  const cache = new Map<string, { url: string; expires: number }>();
  try {
    const saved = JSON.parse(opts.storage?.getItem(key) || "{}") as Record<string, { url: string; expires: number }>;
    Object.entries(saved).forEach(([p, v]) => { if (v?.url && v.expires > now()) cache.set(p, v); });
  } catch { /* ignore corrupt cache */ }
  const persist = () => {
    if (!opts.storage) return;
    try { opts.storage.setItem(key, JSON.stringify(Object.fromEntries(cache))); } catch { /* storage full */ }
  };
  const pending = new Map<string, Promise<string>>();
  const queued = new Map<string, (url: string) => void>();
  let scheduled = false;

  async function flush() {
    scheduled = false;
    const entries = Array.from(queued.entries());
    queued.clear();
    await Promise.all(Array.from({ length: Math.ceil(entries.length / 200) }, async (_, index) => {
      const batch = entries.slice(index * 200, (index + 1) * 200);
      let urls: Record<string, string> = {};
      try { urls = await sign(batch.map(([path]) => path)); }
      catch (error) { console.error("Could not load photo links:", error); }
      batch.forEach(([path]) => { const url = urls[path]; if (url) cache.set(path, { url, expires: now() + ttl }); });
      persist();
      batch.forEach(([path, resolve]) => {
        const url = urls[path] || "";
        pending.delete(path);
        resolve(url);
      });
    }));
  }

  return (paths: string[]) => Promise.all(paths.map((path) => {
    if (!path) return Promise.resolve("");
    const cached = cache.get(path);
    if (cached && cached.expires > now()) return Promise.resolve(cached.url);
    const existing = pending.get(path);
    if (existing) return existing;
    const request = new Promise<string>((resolve) => { queued.set(path, resolve); });
    pending.set(path, request);
    if (!scheduled) { scheduled = true; setTimeout(() => { void flush(); }, 0); }
    return request;
  }));
}