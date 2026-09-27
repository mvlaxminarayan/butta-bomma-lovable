const KEY = "wishlist";

export function getWishlistIds(): string[] {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function isWishlisted(id: string): boolean {
  return getWishlistIds().includes(id);
}

/** Toggles a product in the wishlist. Returns true when now wishlisted. */
export function toggleWishlist(id: string): boolean {
  const ids = getWishlistIds();
  const has = ids.includes(id);
  const next = has ? ids.filter((i) => i !== id) : [...ids, id];
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("wishlist-changed"));
  return !has;
}
