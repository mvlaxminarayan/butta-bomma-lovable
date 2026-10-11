import type { CartItem } from "@/components/Cart";

// A direct purchase is deliberately independent of the saved shopping cart.
export function checkoutItems(cart: CartItem[], buyNowItem?: CartItem): CartItem[] {
  return buyNowItem ? [buyNowItem] : cart;
}

export function clearPurchasedCart(storage: Pick<Storage, "removeItem">, buyNowItem?: CartItem) {
  if (!buyNowItem) storage.removeItem("cart");
}