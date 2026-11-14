export const FREE_SHIPPING_THRESHOLD = 5000;
export const FALLBACK_SHIPPING = 120;
export function toGrams(value: number, unit: string): number {
  return Math.round(value * (unit === 'kg' ? 1000 : 1) * 1000) / 1000;
}
export function parseWeight(text: string): number | null {
  const clean = text.toLowerCase().trim().replace(/,/g, '').replace(/^approx(?:imately)?\.?\s*/, '').replace(/\bgrms\b/g, 'grams');
  // Accept a single mass or a range, never infer weight from dimensions or prose.
  const match = clean.match(/^(\d+(?:\.\d+)?)\s*(?:g|gr|grams?|kgs?|kilograms?)?\s*(?:(?:to|[-–—])\s*(\d+(?:\.\d+)?)\s*)?(kgs?|kilograms?|g|gr|grams?)\.?$/);
  if (!match) return null;
  const grams = toGrams(Math.max(Number(match[1]), Number(match[2] || match[1])), match[3].startsWith('k') ? 'kg' : 'g');
  return grams > 0 && grams <= 1000000 ? grams : null;
}
export function productWeight(p: { weight_grams?: number | null; specifications?: unknown }): number {
  if (Number(p.weight_grams) > 0) return Number(p.weight_grams);
  if (p.specifications && typeof p.specifications === 'object') {
    for (const [key, value] of Object.entries(p.specifications)) {
      if (/^(?:item\s+|product\s+|net\s+)?(?:weight|weigth)(?:\s*\(.*\))?$/i.test(key.trim())) {
        const parsed = parseWeight(String(value));
        if (parsed) return parsed;
      }
    }
  }
  return 500;
}
export function parcelGrams(items: { quantity: number; weight_grams?: number | null; specifications?: unknown }[]): number {
  return items.reduce((sum, item) => sum + productWeight(item) * item.quantity, 0);
}
export function cheapestCourier(rows: any[]): { fee: number; courier_id: number; courier: string } | null {
  return rows.filter(r => !Number(r.blocked) && !Number(r.odablock))
    .map(r => ({ fee: Math.round(Number(r.rate) * 100) / 100, courier_id: Number(r.courier_company_id), courier: String(r.courier_name || '') }))
    .filter(r => Number.isFinite(r.fee) && r.fee > 0 && r.courier_id > 0)
    .sort((a, b) => a.fee - b.fee)[0] || null;
}