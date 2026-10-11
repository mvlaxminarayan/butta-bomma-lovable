import { useEffect, useState } from "react";
import { Hand, Leaf, Users, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { productImageRefs, resolveImageUrls } from "@/lib/productImages";
import { STORE_INFO } from "@/lib/storeInfo";

const trust = [
  { icon: Hand, title: "100% Handcrafted", text: "Made by hand in Nandyal" },
  { icon: Leaf, title: "Natural Wood & Dyes", text: "Eco-friendly materials" },
  { icon: Users, title: "Direct from Artisans", text: "Fair pay, no middlemen" },
  { icon: Truck, title: "Pan-India Shipping", text: "Free over ₹5,000" },
];

export const TrustBar = () => (
  <section aria-label="Why shop with us" className="border-y border-border bg-muted/40">
    <div className="container mx-auto grid grid-cols-2 gap-4 px-4 py-6 md:grid-cols-4">
      {trust.map(({ icon: Icon, title, text }) => (
        <div key={title} className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
          <div><p className="text-sm font-semibold">{title}</p><p className="text-xs text-muted-foreground">{text}</p></div>
        </div>
      ))}
    </div>
  </section>
);

export const StoryTeaser = () => (
  <section className="container mx-auto px-4 py-12 text-center">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Our heritage</p>
    <blockquote className="mx-auto mt-3 max-w-2xl font-serif text-2xl leading-snug md:text-3xl">
      “Every Buttabomma is shaped, painted and finished by hand — a craft passed down through generations.”
    </blockquote>
    <button
      onClick={() => document.getElementById("our-story")?.scrollIntoView({ behavior: "smooth" })}
      className="mt-5 text-sm font-medium text-primary underline underline-offset-4"
    >Read our story</button>
  </section>
);

// Fallback tiles when the store has no products loaded yet.
const FALLBACK_CATS = ["Kondapalli Toys", "Wooden Crafts", "Home Decor", "Ceramics", "Textiles", "Gifts"];

export const CategoryTiles = ({ onPick }: { onPick: (c: string) => void }) => {
  // Use the same live product categories the "Browse Collections" gallery shows.
  const [cats, setCats] = useState<string[]>(FALLBACK_CATS);
  const [photos, setPhotos] = useState<Record<string, string>>({});
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await (supabase as any).schema("api").from("products").select("*");
        if (error || !data) return;
        const firstRef: Record<string, string> = {};
        data.forEach((r: any) => {
          const c = (r.category || "").trim();
          if (!c) return;
          if (!(c in firstRef)) firstRef[c] = "";
          if (!firstRef[c]) firstRef[c] = productImageRefs(r)[0] || "";
        });
        const list = Object.keys(firstRef).sort((a, b) => a.localeCompare(b));
        if (cancelled || list.length === 0) return;
        setCats(list);
        const urls = await resolveImageUrls(list.map((c) => firstRef[c]));
        if (!cancelled) setPhotos(Object.fromEntries(list.map((c, i) => [c, urls[i]])));
      } catch {
        // keep fallback tiles
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <section aria-label="Shop by category" className="container mx-auto px-4 py-10">
      <h2 className="mb-6 text-center font-serif text-2xl">Shop by Category</h2>
      <div className="flex gap-6 overflow-x-auto pb-2 md:justify-center">
        {cats.map((c, i) => (
          <button key={c} onClick={() => onPick(c)} className="group flex shrink-0 flex-col items-center gap-2">
            <span className={`flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-primary/30 text-2xl font-serif text-primary transition group-hover:border-primary group-hover:shadow-md md:h-24 md:w-24 ${i % 2 ? "bg-accent/20" : "bg-primary/10"}`}>
              {photos[c] ? (
                <img src={photos[c]} alt={c} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
              ) : c[0]}
            </span>
            <span className="text-xs font-medium md:text-sm">{c}</span>
          </button>
        ))}
      </div>
    </section>
  );
};

export const MakerBanner = () => (
  <section aria-label="About the maker" className="container mx-auto px-4 pt-8">
    <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-5 py-4 text-center sm:flex-row sm:justify-between sm:text-left">
      <div>
        <p className="font-serif text-lg">Buttabomma Crafts</p>
        <p className="text-sm text-muted-foreground">Nandyal, Andhra Pradesh · Handmade to order · Dispatches in 1–3 days</p>
      </div>
      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">★ Direct from the maker</span>
    </div>
  </section>
);
