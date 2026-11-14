import { z } from 'npm:zod@3';
export const QuoteInput = z.object({
  items: z.array(z.object({ id: z.string().uuid(), quantity: z.number().int().min(1).max(99) })).min(1).max(50),
  pincode: z.string().regex(/^[1-9]\d{5}$/),
  coupon_code: z.string().max(40).nullable().optional(),
}).refine(v => new Set(v.items.map(i => i.id)).size === v.items.length, 'Duplicate items');
export type Quote = {
  items: { id: string; quantity: number }[]; pincode: string; subtotal: number; discount: number;
  shipping: number; total: number; weight_grams: number; courier_id: number | null; courier: string | null;
  source: 'live' | 'fallback' | 'free'; expires: number; coupon_code: string | null;
};
async function signature(payload: string) {
  const secret = Deno.env.get('RAZORPAY_KEY_SECRET');
  if (!secret) throw new Error('Payment configuration unavailable');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`shipping-quote:${payload}`)))).map(b => b.toString(16).padStart(2, '0')).join('');
}
export async function signQuote(quote: Quote) {
  const payload = btoa(JSON.stringify(quote));
  return `${payload}.${await signature(payload)}`;
}
export async function verifyQuote(token: string): Promise<Quote> {
  const [payload, sig] = token.split('.');
  if (!payload || !sig || await signature(payload) !== sig) throw new Error('Refresh your shipping charge before payment.');
  const quote: Quote = JSON.parse(atob(payload));
  if (quote.expires < Date.now()) throw new Error('Shipping quote expired. Refresh your shipping charge.');
  return quote;
}