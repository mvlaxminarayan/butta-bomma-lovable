import { Button } from "@/components/ui/button";
import heroImage from "@/assets/kondapalli.jpg";
import heroImage1 from "@/assets/hero-image.jpg";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { resolveImageUrls, productImageRefs } from "@/lib/productImages";
import { fetchStoreSettings } from "@/lib/pricing";

interface Slide {
  id: string | null;
  name: string;
  price: number | null;
  image: string;
}

const DEFAULT_SLIDES: Slide[] = [
  { id: null, name: "", price: null, image: heroImage },
  { id: null, name: "", price: null, image: heroImage1 },
];

const Hero = () => {
  const navigate = useNavigate();
  const [slides, setSlides] = useState<Slide[]>(DEFAULT_SLIDES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [freeShipping, setFreeShipping] = useState<number | null>(50);

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await (supabase as any)
          .schema("api")
          .from("products")
          .select("*")
          .eq("in_stock", true)
          .eq("is_featured", true)
          .order("created_at", { ascending: false })
          .limit(8);
        if (error || !data || data.length === 0) return;

        const refs = data
          .map((p: any) => productImageRefs(p)[0])
          .filter(Boolean) as string[];
        const unique = Array.from(new Set(refs));
        const urls = await resolveImageUrls(unique);
        const urlByRef: Record<string, string> = {};
        unique.forEach((r, i) => { urlByRef[r] = urls[i]; });

        const built: Slide[] = data
          .map((p: any) => {
            const ref = productImageRefs(p)[0];
            const url = ref ? urlByRef[ref] : "";
            if (!url) return null;
            return { id: p.id as string, name: p.name as string, price: Number(p.price), image: url };
          })
          .filter(Boolean) as Slide[];

        if (!cancelled && built.length > 0) {
          setSlides(built);
          setCurrentIndex(0);
        }
      } catch {
        /* keep default slides */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchStoreSettings().then((s) => {
      if (!cancelled) setFreeShipping(s.free_shipping_threshold);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (slides.length < 2) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const active = slides[currentIndex];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background to-secondary">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                Handcrafted
                <span className="block text-primary">with Love</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-lg">
                Discover unique, artisanal pieces made by skilled craftspeople. 
                Each item tells a story of tradition, quality, and care.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                onClick={() => scrollTo("products")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-elegant transition-all duration-300 hover:shadow-2xl hover:scale-105"
              >
                Shop Collection
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => scrollTo("our-story")}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
              >
                Our Story
              </Button>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-4">
              <div>
                <div className="text-2xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Happy Customers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">50+</div>
                <div className="text-sm text-muted-foreground">Unique Items</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">100%</div>
                <div className="text-sm text-muted-foreground">Handmade</div>
              </div>
            </div>
          </div>

          {/* Featured product slider */}
          <div className="relative">
            <div
              role={active?.id ? "link" : undefined}
              tabIndex={active?.id ? 0 : undefined}
              aria-label={active?.id ? `View ${active.name}` : undefined}
              onClick={() => active?.id && navigate(`/product/${active.id}`)}
              onKeyDown={(e) => {
                if (active?.id && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  navigate(`/product/${active.id}`);
                }
              }}
              className={`group relative overflow-hidden rounded-2xl shadow-elegant h-[400px] md:h-[500px] ${
                active?.id ? "cursor-pointer" : ""
              }`}
            >
              {slides.map((slide, index) => (
                <img
                  key={`${slide.id ?? "default"}-${index}`}
                  src={slide.image}
                  alt={slide.name || "Featured piece"}
                  className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                    index === currentIndex ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

              {active?.id && (
                <div className="absolute bottom-0 left-0 right-0 p-6 text-primary-foreground">
                  <div className="text-xl font-semibold drop-shadow">{active.name}</div>
                  <div className="flex items-center gap-3 text-sm opacity-90">
                    {active.price != null && <span>${active.price.toFixed(2)}</span>}
                    <span className="underline underline-offset-4 group-hover:opacity-100 opacity-80">
                      View piece →
                    </span>
                  </div>
                </div>
              )}

              {slides.length > 1 && (
                <div className="absolute top-4 right-4 flex gap-2">
                  {slides.map((s, i) => (
                    <button
                      key={`dot-${s.id ?? i}`}
                      type="button"
                      aria-label={`Show featured item ${i + 1}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentIndex(i);
                      }}
                      className={`h-2 rounded-full transition-all ${
                        i === currentIndex ? "w-6 bg-primary-foreground" : "w-2 bg-primary-foreground/50"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* Floating Badge */}
            {freeShipping != null && (
              <div className="absolute -top-3 -left-4 bg-accent text-accent-foreground px-6 py-3 rounded-full shadow-elegant">
                <div className="font-semibold">Free Shipping</div>
                <div className="text-sm opacity-90">On orders over ${freeShipping}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
