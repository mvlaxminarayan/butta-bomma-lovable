import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { productSchema } from "./productValidation";

const valid = { name: "Pot lady with baby", description: "", price: 249, category: "Traditional dolls", stock_quantity: 0, weight_grams: 250, images: ["products/photo.jpg"] };
describe("Required product details", () => {
  it("requires at least 1 photo", () => {
    assert.equal(productSchema.safeParse({ ...valid, images: [] }).success, false);
    assert.equal(productSchema.safeParse({ ...valid, images: [" "] }).success, false);
    assert.equal(productSchema.safeParse(valid).success, true);
  });
  it("requires a positive explicit shipping weight", () => {
    for (const weight_grams of [undefined, 0, -1, NaN, Infinity, 1000001]) {
      assert.equal(productSchema.safeParse({ ...valid, weight_grams }).success, false);
    }
    assert.equal(productSchema.safeParse({ ...valid, weight_grams: 1000 }).success, true);
  });
  it("requires a nonblank name", () => {
    assert.equal(productSchema.safeParse({ ...valid, name: "  " }).success, false);
  });
  it("requires a category", () => {
    assert.equal(productSchema.safeParse({ ...valid, category: "" }).success, false);
  });
  it("requires a finite positive price", () => {
    for (const price of [0, -1, NaN, Infinity]) assert.equal(productSchema.safeParse({ ...valid, price }).success, false);
  });
  it("requires whole nonnegative stock, allowing out-of-stock products", () => {
    for (const stock_quantity of [-1, 1.5, NaN]) assert.equal(productSchema.safeParse({ ...valid, stock_quantity }).success, false);
    assert.equal(productSchema.safeParse(valid).success, true);
  });
});