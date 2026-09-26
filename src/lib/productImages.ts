import { supabase } from "@/integrations/supabase/client";
import productMug from "@/assets/product-mug.jpg";
import productBasket from "@/assets/product-basket.jpg";
import productCuttingBoard from "@/assets/product-cutting-board.jpg";

export const BUCKET = "product-images";
const SIGNED_URL_TTL = 60 * 60 * 24 * 7; // 7 days

export const LOCAL_ASSETS: Record<string, string> = {
  "product-mug.jpg": productMug,
  "product-basket.jpg": productBasket,
  "product-cutting-board.jpg": productCuttingBoard,
};

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
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_TTL);
    if (error) console.error("Signed URL error:", error);
    data?.forEach((d) => { if (d.path && d.signedUrl) signed[d.path] = d.signedUrl; });
  }
  return refs
    .map((r) => (r.startsWith("http") ? r : LOCAL_ASSETS[r] || signed[r]))
    .filter(Boolean) as string[];
}

export async function uploadProductImage(file: File | Blob, ext = "jpg"): Promise<string> {
  const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: (file as File).type || "image/jpeg",
  });
  if (error) throw error;
  return path;
}

export const FALLBACK_IMAGE = productMug;
