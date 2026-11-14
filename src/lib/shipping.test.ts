import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseWeight, productWeight, toGrams, parcelGrams, cheapestCourier, FREE_SHIPPING_THRESHOLD, FALLBACK_SHIPPING } from '../../supabase/functions/_shared/shippingRules';
test('grams and fractional kilograms are converted exactly', () => {
  assert.equal(toGrams(250, 'g'), 250);
  assert.equal(toGrams(1.5, 'kg'), 1500);
});
test('legacy ranges take the upper end without changing customer specifications', () => {
  assert.equal(parseWeight('30 to 60 gr'), 60);
  assert.equal(parseWeight('1–1.5 kg'), 1500);
  assert.equal(parseWeight('30 g to 60 grams'), 60);
  assert.equal(parseWeight('25 x 20 x 10 cm'), null);
  assert.equal(parseWeight('approximately 30 to 60 pieces'), null);
  assert.equal(productWeight({ specifications: { Weight: '30 to 60 gr' } }), 60);
  assert.equal(productWeight({ specifications: { Weigth: '500 to 600 grms' } }), 600);
  assert.equal(productWeight({ specifications: { weight: 'approx 700 to 800 grms' } }), 800);
  assert.equal(productWeight({ specifications: { weigth: '1 kg to 1.2kg' } }), 1200);
});
test('explicit weights override legacy ranges; missing weights retain 500g default', () => {
  assert.equal(productWeight({ weight_grams: 75, specifications: { Weight: '30 to 60 gr' } }), 75);
  assert.equal(productWeight({}), 500);
});
test('cart and direct purchases use quantities without rounding away light items', () => {
  assert.equal(parcelGrams([{ quantity: 8, weight_grams: 80 }, { quantity: 1, weight_grams: 1500 }]), 2140);
  assert.equal(parcelGrams([{ quantity: 2, weight_grams: 60 }]), 120);
});
test('cheapest available courier is chosen without DTDC restriction', () => {
  assert.deepEqual(cheapestCourier([
    { courier_company_id: 1, courier_name: 'DTDC', rate: 85 },
    { courier_company_id: 2, courier_name: 'Delhivery', rate: 42.25 },
    { courier_company_id: 3, courier_name: 'Blocked', rate: 10, blocked: 1 },
  ]), { courier_id: 2, courier: 'Delhivery', fee: 42.25 });
  assert.equal(cheapestCourier([{ rate: null, courier_company_id: 1 }]), null);
});
test('free shipping begins at ₹5000, backup is ₹120', () => {
  assert.equal(4999 >= FREE_SHIPPING_THRESHOLD, false);
  assert.equal(5000 >= FREE_SHIPPING_THRESHOLD, true);
  assert.equal(FALLBACK_SHIPPING, 120);
});