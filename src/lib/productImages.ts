import { supabase } from "@/integrations/supabase/client";

export const BUCKET = "product-images";

/** Legacy built-in photo names; sample photos were removed, so none resolve locally. */
export const LOCAL_ASSETS: Record<string, string> = {};

const isStoragePath = (v: string) => !v.startsWith("http") && !LOCAL_ASSETS[v];

/** Collect a product's image references: `images` array first, then legacy `image_url`. */
export const productImageRefs = (p: { images?: string[] | null; image_url?: string | null }) => {
  const refs = (p.images || []).filter(Boolean);
  if (refs.length === 0 && p.image_url) refs.push(p.image_url);
  return refs;
};

/** Turn stored references (storage paths, full URLs, legacy asset names) into displayable URLs. */
export async function resolveImageUrls(refs: string[]): Promise<string[]> {
  const paths = Array.from(new Set(refs.filter(isStoragePath)));
  const signed: Record<string, string> = {};
  if (paths.length) {
    // Bucket is private with no public read rule; a server function signs only photos the store displays.
    await Promise.all(Array.from({ length: Math.ceil(paths.length / 200) }, async (_, index) => {
      const batch = paths.slice(index * 200, (index + 1) * 200);
      const { data, error } = await supabase.functions.invoke("product-image-urls", { body: { paths: batch } });
      if (error) console.error("Signed URL error:", error);
      Object.assign(signed, (data?.urls as Record<string, string>) || {});
    }));
  }
  // Keeps the same order/length as refs; unresolved entries become "".
  return refs.map((r) => (r.startsWith("http") ? r : LOCAL_ASSETS[r] || signed[r] || ""));
}

export async function uploadProductImage(file: File | Blob, ext = "jpg"): Promise<string> {
  const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: (file as File).type || "image/jpeg",
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
