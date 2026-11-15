export const canPurchaseProduct = (product: { inStock: boolean }): boolean => product.inStock === true;

/** Most units a shopper may hold; unknown stock (older saved carts) is left to the checkout check. */
export const maxPurchasable = (product: { inStock: boolean; stockQuantity?: number | null }): number => {
  if (!canPurchaseProduct(product)) return 0;
  const stock = product.stockQuantity;
  return typeof stock === "number" && Number.isFinite(stock) ? Math.max(0, Math.floor(stock)) : Infinity;
};

export const clampQuantity = (product: { inStock: boolean; stockQuantity?: number | null }, quantity: number): number =>
  Math.max(0, Math.min(Math.floor(quantity), maxPurchasable(product)));
