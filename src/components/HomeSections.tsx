import { useEffect, useState } from "react";
import { Search, ChevronDown, LayoutGrid } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { productImageRefs, resolveImageUrls } from "@/lib/productImages";
import { fetchCatalog } from "@/lib/catalog";
import { Input } from "@/components/ui/input";

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

interface CategoryTilesProps {
  onPick: (c: string) => void;
  activeCategory?: string;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  sort?: string;
  onSortChange?: (s: string) => void;
}

export const CategoryTiles = ({ onPick, activeCategory = "All", searchQuery = "", onSearchChange, sort = "featured", onSortChange }: CategoryTilesProps) => {
  // Use the same live product categories the "Browse Collections" gallery shows.
  const [cats, setCats] = useState<string[]>(FALLBACK_CATS);
  const [photos, setPhotos] = useState<Record<string, string>>({});
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await fetchCatalog();
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

  const circle = (key: string, label: string, photo: string, index: number) => {
    const active = activeCategory === key;
    return (
      <button key={key} onClick={() => onPick(key)} className="group flex shrink-0 flex-col items-center gap-2" aria-pressed={active}>
        <span className={`flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 text-2xl font-serif text-primary transition group-hover:border-primary group-hover:shadow-md md:h-24 md:w-24 ${active ? "border-primary ring-2 ring-primary/30" : "border-primary/30"} ${index % 2 ? "bg-accent/20" : "bg-primary/10"}`}>
          {photo ? (
            <img src={photo} alt={label} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
          ) : key === "All" ? (
            <LayoutGrid className="h-7 w-7" aria-hidden="true" />
          ) : label[0]}
        </span>
        <span className={`text-xs font-medium md:text-sm ${active ? "text-primary" : ""}`}>{label}</span>
      </button>
    );
  };

  return (
    <section aria-label="Shop by category" className="container mx-auto px-4 py-8">
      <h2 className="mb-5 text-center font-serif text-2xl">Shop by Category</h2>
      <div className="flex items-center gap-6 overflow-x-auto pb-2 lg:justify-center">
        {circle("All", "All Items", "", 0)}
        {cats.map((c, i) => circle(c, c, photos[c] || "", i + 1))}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search handcrafted items..."
            className="pl-10 border-border focus:ring-primary"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                document.getElementById("products")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }}
            aria-label="Search products"
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden text-[10px] font-bold uppercase tracking-widest text-muted-foreground sm:inline">Sort by</span>
          <div className="relative">
            <select
              aria-label="Sort products"
              value={sort}
              onChange={(e) => onSortChange?.(e.target.value)}
              className="appearance-none bg-transparent pr-6 text-sm font-semibold text-foreground focus:outline-none cursor-pointer"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name: A–Z</option>
            </select>
            <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
};


