import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { canPurchaseProduct, maxPurchasable, clampQuantity } from "./productAvailability";

describe("Product purchase availability", () => {
  it("prevents purchasing or adding out-of-stock products", () => {
    assert.equal(canPurchaseProduct({ inStock: false }), false);
  });
  it("allows purchasing in-stock products", () => {
    assert.equal(canPurchaseProduct({ inStock: true }), true);
  });
});
it("quantity cannot exceed available stock", () => {
  assert.equal(maxPurchasable({ inStock: true, stockQuantity: 3 }), 3);
  assert.equal(clampQuantity({ inStock: true, stockQuantity: 3 }, 5), 3);
  assert.equal(clampQuantity({ inStock: true, stockQuantity: 3 }, 2), 2);
  assert.equal(clampQuantity({ inStock: false, stockQuantity: 3 }, 1), 0);
});
