import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FALLBACK_IMAGE, productImageRefs, resolveImageUrls } from "@/lib/productImages";
import { formatINR } from "@/lib/pricing";

type Compared = { id: string; name: string; price: number; in_stock: boolean; image: string; specifications: Record<string, string> };

export default function SimilarProductsCompare({ current, category }: { current: Compared; category: string }) {
  const [similar, setSimilar] = useState<Compared[]>([]);
  useEffect(() => {
    let active = true;
    setSimilar([]);
    if (!category || category === "Uncategorized") return;
    (async () => {
      const { data, error } = await (supabase as any).schema("api").from("products")
        .select("id,name,price,in_stock,images,image_url,specifications")
        .eq("category", category).neq("id", current.id).order("in_stock", { ascending: false }).limit(3);
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
  }, [current.id, category]);

  if (!similar.length) return null;
  const compared = [current, ...similar];
  const specs = [...new Set(compared.flatMap((item) => Object.keys(item.specifications)))].slice(0, 8);
  return <section className="border-t border-border pt-7" aria-labelledby="compare-title">
    <p className="text-xs font-semibold uppercase tracking-widest text-primary">Explore the collection</p>
    <h2 id="compare-title" className="text-2xl font-semibold mt-1 mb-1">Compare similar pieces</h2>
    <p className="text-sm text-muted-foreground mb-5">Compare this piece with others in {category}. Scroll sideways on smaller screens.</p>
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[640px] text-sm text-left border-collapse">
        <caption className="sr-only">Compare {current.name} with other pieces in {category}</caption>
        <thead><tr className="bg-card"><th scope="col" className="w-28 p-3 text-muted-foreground font-medium align-top">Piece</th>{compared.map((item, i) => <th scope="col" key={item.id} className="min-w-36 p-3 align-top border-l border-border font-medium">
          <Link to={`/product/${item.id}`} className="group block space-y-2 hover:text-primary">
            <img src={item.image} alt="" className="w-full h-24 sm:h-36 object-cover rounded-md" loading="lazy" />
            <span className="block">{item.name} {i === 0 && <span className="block text-xs text-primary">This piece</span>}</span>
            {i !== 0 && <span className="block text-xs text-primary">View piece →</span>}
          </Link>
        </th>)}</tr></thead>
        <tbody>
          <tr className="border-t border-border"><th scope="row" className="p-3 font-medium">Price</th>{compared.map((item) => <td key={item.id} className="p-3 border-l border-border font-semibold text-price">{formatINR(item.price)}</td>)}</tr>
          <tr className="border-t border-border"><th scope="row" className="p-3 font-medium">Availability</th>{compared.map((item) => <td key={item.id} className="p-3 border-l border-border">{item.in_stock ? "In stock" : "Out of stock"}</td>)}</tr>
          {specs.map((key) => <tr key={key} className="border-t border-border"><th scope="row" className="p-3 font-medium">{key}</th>{compared.map((item) => <td key={item.id} className="p-3 border-l border-border text-muted-foreground">{item.specifications[key] || "—"}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  </section>;
}