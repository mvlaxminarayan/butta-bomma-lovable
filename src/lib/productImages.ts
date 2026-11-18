import { supabase } from "@/integrations/supabase/client";
import { createPhotoResolver } from "./photoResolver";

export const BUCKET = "product-images";

/** Legacy built-in photo names; sample photos were removed, so none resolve locally. */
export const LOCAL_ASSETS: Record<string, string> = {};

const isStoragePath = (v: string) => !v.startsWith("http") && !LOCAL_ASSETS[v];

// Links are signed for 7 days; reusing the same link for 6 days lets browsers serve photos from cache
// instead of downloading them again on every visit.
const LINK_REUSE_MS = 6 * 24 * 60 * 60 * 1000;
const browserStore = () => { try { return window.localStorage; } catch { return undefined; } };
const newResolver = (identity: string | null = null) => createPhotoResolver(async (paths) => {
  const { data, error } = await supabase.functions.invoke("product-image-urls", { body: { paths } });
  if (error) throw error;
  return (data?.urls as Record<string, string>) || {};
}, Date.now, { ttlMs: LINK_REUSE_MS, storage: browserStore(), storageKey: `bb-photo-links:${identity ?? "guest"}` });
let resolvePhotos = newResolver();
let photoIdentity: string | null = null;
supabase.auth.onAuthStateChange((_event, session) => {
  const identity = session?.user.id ?? null;
  if (identity !== photoIdentity) {
    photoIdentity = identity;
    resolvePhotos = newResolver(identity);
  }
});

/** Collect a product's image references: `images` array first, then legacy `image_url`. */
export const productImageRefs = (p: { images?: string[] | null; image_url?: string | null }) => {
  const refs = (p.images || []).filter(Boolean);
  if (refs.length === 0 && p.image_url) refs.push(p.image_url);
  return refs;
};

/** Turn stored references (storage paths, full URLs, legacy asset names) into displayable URLs. */
export async function resolveImageUrls(refs: string[]): Promise<string[]> {
  const paths = Array.from(new Set(refs.filter(isStoragePath)));
  const urls = await resolvePhotos(paths);
  const signed = Object.fromEntries(paths.map((path, index) => [path, urls[index]]));
  // Keeps the same order/length as refs; unresolved entries become "".
  return refs.map((r) => (r.startsWith("http") ? r : LOCAL_ASSETS[r] || signed[r] || ""));
}

export async function uploadProductImage(file: File | Blob, ext = "jpg"): Promise<string> {
  const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: (file as File).type || "image/jpeg",
    cacheControl: "31536000",
  });
  if (error) throw error;
  return path;
}

/** Neutral placeholder (never sample artwork) for products without a photo. */
export const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#f1ede6"/><path d="M140 250l50-60 40 45 30-30 50 45H140z" fill="#cfc6b8"/><circle cx="250" cy="160" r="18" fill="#cfc6b8"/></svg>'
  );

/** Re-compresses an already stored photo in place (same path, so products keep their links). Returns bytes saved. */
export async function optimizeStoredPhoto(path: string, shrink: (b: Blob) => Promise<Blob>, minBytes = 400_000): Promise<number> {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) throw error || new Error("Could not read photo");
  if (data.size < minBytes) return 0;
  const smaller = await shrink(data);
  if (smaller.size >= data.size) return 0;
  const { error: upErr } = await supabase.storage.from(BUCKET).update(path, smaller, {
    contentType: "image/jpeg", cacheControl: "31536000", upsert: true,
  });
  if (upErr) throw upErr;
  return data.size - smaller.size;
}
