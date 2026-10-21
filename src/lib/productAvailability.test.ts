import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { canPurchaseProduct } from "./productAvailability";

describe("Product purchase availability", () => {
  it("prevents purchasing or adding out-of-stock products", () => {
    assert.equal(canPurchaseProduct({ inStock: false }), false);
  });
  it("allows purchasing in-stock products", () => {
    assert.equal(canPurchaseProduct({ inStock: true }), true);
  });
});