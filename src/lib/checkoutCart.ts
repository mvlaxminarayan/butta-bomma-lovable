import type { CartItem } from "@/components/Cart";

// A direct purchase is deliberately independent of the saved shopping cart.
export function checkoutItems(cart: CartItem[], buyNowItem?: CartItem): CartItem[] {
  return buyNowItem ? [buyNowItem] : cart;
}

export function clearPurchasedCart(storage: Pick<Storage, "removeItem">, buyNowItem?: CartItem) {
  if (!buyNowItem) storage.removeItem("cart");
}
// When a Buy Now payment fails or is closed, keep the item in the saved cart so it isn't lost.
export function saveBuyNowItemToCart(storage: Pick<Storage, "getItem" | "setItem">, buyNowItem: CartItem) {
  let cart: CartItem[] = [];
  try { const parsed = JSON.parse(storage.getItem("cart") || "[]"); if (Array.isArray(parsed)) cart = parsed; } catch { /* ignore */ }
  const existing = cart.find((i) => i.id === buyNowItem.id);
  if (existing) {
    const cap = typeof buyNowItem.stockQuantity === "number" ? buyNowItem.stockQuantity : Infinity;
    existing.quantity = Math.max(existing.quantity, Math.min(cap, buyNowItem.quantity));
  } else {
    cart.push({ ...buyNowItem });
  }
  storage.setItem("cart", JSON.stringify(cart));
  return cart;
}
