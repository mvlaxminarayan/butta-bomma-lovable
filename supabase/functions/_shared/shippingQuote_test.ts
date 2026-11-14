import { QuoteInput, signQuote, verifyQuote, type Quote } from './shippingQuote.ts';
const assert = (value: boolean, message: string) => { if (!value) throw new Error(message); };
const quote: Quote = { items: [{ id: '11111111-1111-4111-8111-111111111111', quantity: 2 }], pincode: '560001', subtotal: 1200, discount: 0, shipping: 42.25, total: 1242.25, weight_grams: 120, courier_id: 2, courier: 'Test', source: 'live', expires: Date.now() + 60000, coupon_code: null };
Deno.test('signed quote preserves checked amount and parcel mass', async () => {
  Deno.env.set('RAZORPAY_KEY_SECRET', 'local-test-only');
  const result = await verifyQuote(await signQuote(quote));
  assert(result.total === 1242.25 && result.shipping === 42.25 && result.weight_grams === 120, 'Quote changed');
});
Deno.test('modified quote cannot change shipping or payment', async () => {
  Deno.env.set('RAZORPAY_KEY_SECRET', 'local-test-only');
  const token = await signQuote(quote);
  const [, signature] = token.split('.');
  let rejected = false;
  try { await verifyQuote(`${btoa(JSON.stringify({ ...quote, shipping: 0, total: 1200 }))}.${signature}`); } catch { rejected = true; }
  assert(rejected, 'Tampered quote accepted');
});
Deno.test('expired quote requires refresh', async () => {
  Deno.env.set('RAZORPAY_KEY_SECRET', 'local-test-only');
  let rejected = false;
  try { await verifyQuote(await signQuote({ ...quote, expires: Date.now() - 1000 })); } catch { rejected = true; }
  assert(rejected, 'Expired quote accepted');
});
Deno.test('quote input rejects invalid pincode and duplicate quantities', () => {
  assert(!QuoteInput.safeParse({ ...quote, pincode: '000000' }).success, 'Invalid pincode accepted');
  assert(!QuoteInput.safeParse({ ...quote, items: [quote.items[0], quote.items[0]] }).success, 'Duplicate accepted');
});