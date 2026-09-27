import { useEffect, useState } from "react";
import { getWishlistIds } from "@/lib/wishlist";

/** Returns the wishlist ids, kept in sync across tabs and UI changes. */
export function useWishlistIds(): string[] {
  const [ids, setIds] = useState<string[]>(() => getWishlistIds());

  useEffect(() => {
    const update = () => setIds(getWishlistIds());
    window.addEventListener("wishlist-changed", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("wishlist-changed", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return ids;
}
