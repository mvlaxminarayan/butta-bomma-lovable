/** Short-lived, in-memory links; create a fresh resolver when the signed-in identity changes. */
export function createPhotoResolver(
  sign: (paths: string[]) => Promise<Record<string, string>>,
  now: () => number = Date.now,
) {
  const cache = new Map<string, { url: string; expires: number }>();
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
      batch.forEach(([path, resolve]) => {
        const url = urls[path] || "";
        if (url) cache.set(path, { url, expires: now() + 5 * 60 * 1000 });
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