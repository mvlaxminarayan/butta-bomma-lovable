/// <reference types="node" />
import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { checkoutItems, clearPurchasedCart } from "./checkoutCart";
import type { CartItem } from "@/components/Cart";

const item = (id: string, price: number, quantity: number): CartItem => ({
  id, price, quantity, name: id, image: "", category: "Crafts", inStock: true, rating: 0, reviews: 0,
});
const cart = [item("saved", 1500, 2)];
const direct = item("buy-now", 800, 3);

describe("Buy Now checkout", () => {
  it("charges only the selected product and its chosen quantity", () => {
    const items = checkoutItems(cart, direct);
    assert.deepEqual(items.map(i => i.id), ["buy-now"]);
    assert.equal(items.reduce((sum, i) => sum + i.price * i.quantity, 0), 2400);
  });
  it("preserves the saved cart after a direct purchase", () => {
    const removed: string[] = [];
    clearPurchasedCart({ removeItem: key => removed.push(key) }, direct);
    assert.deepEqual(removed, []);
  });
  it("regular checkout still purchases and clears the saved cart", () => {
    assert.deepEqual(checkoutItems(cart), cart);
    const removed: string[] = [];
    clearPurchasedCart({ removeItem: key => removed.push(key) });
    assert.deepEqual(removed, ["cart"]);
  });
});