import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Order } from "@/lib/orders";
import { productImageRefs, resolveImageUrls, FALLBACK_IMAGE } from "@/lib/productImages";

/** Product photo + name for each item in an order; tapping opens the product page. Works signed-in or as a guest. */
export const OrderItemThumbs = ({ items }: { items: Order["items"] }) => {
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const idKey = (items || []).map((i) => i.id).join(",");

  useEffect(() => {
    const ids = Array.from(new Set((items || []).map((i) => i.id).filter(Boolean)));
    if (!ids.length) return;
    let cancelled = false;
    (async () => {
      const { data: prods } = await (supabase as any).schema("api").from("products")
        .select("id, image_url, images").in("id", ids);
      const map: Record<string, string> = {};
      for (const p of prods || []) {
        const [ref] = productImageRefs(p as any);
        if (!ref) continue;
        const [url] = await resolveImageUrls([ref]);
        if (url) map[p.id] = url;
      }
      if (!cancelled) setThumbs(map);
    })();
    return () => { cancelled = true; };
  }, [idKey]);

  if (!items?.length) return null;
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id}>
          <Link to={`/product/${item.id}`} aria-label={`View ${item.name}`} className="group flex items-center gap-3">
            <span className="relative block shrink-0">
              <img src={thumbs[item.id] || FALLBACK_IMAGE} alt={item.name}
                className="h-16 w-16 rounded-md border object-cover transition-opacity group-hover:opacity-90" />
              {item.quantity > 1 && (
                <span className="absolute -right-1.5 -top-1.5 rounded-full bg-primary px-1.5 text-[10px] font-semibold leading-4 text-primary-foreground">
                  ×{item.quantity}
                </span>
              )}
            </span>
            <span className="min-w-0 text-sm font-medium group-hover:underline">{item.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
};
