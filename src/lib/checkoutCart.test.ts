/// <reference types="node" />
import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { checkoutItems, clearPurchasedCart, saveBuyNowItemToCart } from "./checkoutCart";
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
describe("failed Buy Now payment", () => {
  it("adds the item to the cart and keeps existing items", () => {
    const store = new Map([["cart", JSON.stringify(cart)]]);
    const s = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
    saveBuyNowItemToCart(s, direct);
    const saved = JSON.parse(store.get("cart")!);
    assert.deepEqual(saved.map((i: CartItem) => [i.id, i.quantity]), [["saved", 2], ["buy-now", 3]]);
  });
  it("does not duplicate an item already in the cart", () => {
    const store = new Map([["cart", JSON.stringify([item("buy-now", 800, 1)])]]);
    const s = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
    saveBuyNowItemToCart(s, direct);
    assert.deepEqual(JSON.parse(store.get("cart")!).map((i: CartItem) => [i.id, i.quantity]), [["buy-now", 3]]);
  });
});
