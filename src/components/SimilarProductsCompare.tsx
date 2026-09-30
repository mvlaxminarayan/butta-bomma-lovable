import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FALLBACK_IMAGE, productImageRefs, resolveImageUrls } from "@/lib/productImages";
import { formatINR } from "@/lib/pricing";

type Compared = { id: string; name: string; price: number; in_stock: boolean; image: string; specifications: Record<string, string> };

export default function SimilarProductsCompare({ productId, category }: { productId: string; category: string }) {
  const [similar, setSimilar] = useState<Compared[]>([]);
  useEffect(() => {
    let active = true;
    setSimilar([]);
    if (!category || category === "Uncategorized") return;
    (async () => {
      const { data, error } = await (supabase as any).schema("api").from("products")
        .select("id,name,price,in_stock,images,image_url,specifications")
        .eq("category", category).neq("id", productId).order("in_stock", { ascending: false }).limit(3);
      if (error || !data?.length) return;
      const refs = data.map((p: any) => productImageRefs(p)[0] || "");
      const urls = await resolveImageUrls(refs.filter(Boolean));
      const images = Object.fromEntries(refs.filter(Boolean).map((ref: string, i: number) => [ref, urls[i]]));
      if (active) setSimilar(data.map((p: any, i: number) => ({
        id: p.id, name: p.name, price: Number(p.price), in_stock: p.in_stock,
        image: images[refs[i]] || FALLBACK_IMAGE,
        specifications: p.specifications && typeof p.specifications === "object" && !Array.isArray(p.specifications) ? p.specifications : {},
      })));
    })();
    return () => { active = false; };
  }, [productId, category]);

  if (!similar.length) return null;
  return <section className="border-t border-border pt-7" aria-labelledby="compare-title">
    <p className="text-xs font-semibold uppercase tracking-widest text-primary">Explore the collection</p>
    <h2 id="compare-title" className="text-2xl font-semibold mt-1 mb-1">Compare similar pieces</h2>
    <p className="text-sm text-muted-foreground mb-5">Other pieces in {category}. Open a piece to see its full details.</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {similar.map((item) => <Link to={`/product/${item.id}`} key={item.id} className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 hover:shadow-md transition-all focus-visible:outline-primary">
        <img src={item.image} alt={item.name} className="h-44 w-full object-cover" loading="lazy" />
        <div className="p-4 space-y-2">
          <h3 className="font-semibold group-hover:text-primary transition-colors">{item.name}</h3>
          <div className="flex justify-between text-sm"><span className="font-semibold text-price">{formatINR(item.price)}</span><span className="text-muted-foreground">{item.in_stock ? "In stock" : "Out of stock"}</span></div>
          {Object.entries(item.specifications).slice(0, 3).map(([key, value]) => <div key={key} className="flex justify-between gap-3 text-xs border-t border-border pt-2"><span className="text-muted-foreground">{key}</span><span className="text-right">{String(value)}</span></div>)}
          <span className="inline-block text-sm font-medium text-primary pt-1">View piece →</span>
        </div>
      </Link>)}
    </div>
  </section>;
}