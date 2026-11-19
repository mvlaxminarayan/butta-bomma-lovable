import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import homepagePhoto from "@/assets/buttabomma-home-v4.png.asset.json";
import { resolveImageUrls, productImageRefs } from "@/lib/productImages";
import { formatINR } from "@/lib/pricing";
import { fetchCatalog } from "@/lib/catalog";

interface Slide {
  id: string | null;
  name: string;
  price: number | null;
  image: string;
}



const Hero = ({ onViewFeatured, onViewProduct }: { onViewFeatured?: () => void; onViewProduct: (id: string) => void }) => {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);


  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: catalog, error } = await fetchCatalog();
        const data = catalog?.filter((p) => p.in_stock && p.is_featured).slice(0, 8);
        if (error || !data || data.length === 0) {
          if (!cancelled) setSlides([]);
          return;
        }

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
        else if (!cancelled) setSlides([]);
      } catch {
        if (!cancelled) setSlides([]);
      }
    })();
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
    <section className="relative overflow-hidden">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-7 items-stretch">
          {/* Content */}
          <div className="flex flex-col gap-6">
            <h1 className="sr-only">Buttabomma Crafts — Traditional Toys, Timeless Happiness</h1>
            <div className="homepage-artwork mx-auto relative overflow-hidden">
            <img
              src={homepagePhoto.url}
              alt="Buttabomma — Traditional Toys, Timeless Happiness, with Kondapalli and Etikoppaka toys"
              width={1672}
              height={941}
              fetchPriority="high"
              className="block h-full w-full object-contain"
            />
            </div>
          </div>

          <div className={`mx-auto grid w-full max-w-[917px] items-center gap-6 ${slides.length > 0 ? "md:grid-cols-2" : "grid-cols-1"}`}>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row justify-center gap-4">
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
                // Hidden on phones: Our Story lives in the menu there.
                data-mobile-hidden
                className="hidden sm:inline-flex border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
              >
                Our Story
              </Button>
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-4 sm:gap-8">
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

          {/* Featured product slider: only shown when featured products exist */}
          {slides.length > 0 && (
          <div className="relative w-full md:justify-self-end">
            <div
              role={active?.id ? "link" : undefined}
              tabIndex={active?.id ? 0 : undefined}
              aria-label={active?.id ? `View ${active.name}` : undefined}
              onClick={() => active?.id && onViewProduct(active.id)}
              onKeyDown={(e) => {
                if (active?.id && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onViewProduct(active.id);
                }
              }}
              className={`group relative overflow-hidden rounded-2xl shadow-elegant h-[220px] ${
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
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onViewFeatured?.(); }}
                onKeyDown={(e) => e.stopPropagation()}
                aria-label="View all featured items"
                className="absolute top-4 left-4 z-10 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary shadow transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                Featured Spotlight · View all →
              </button>

              {active?.id && (
                <div className="absolute bottom-0 left-0 right-0 p-6 text-primary-foreground">
                  <div className="text-xl font-semibold drop-shadow">{active.name}</div>
                  <div className="flex items-center gap-3 text-sm opacity-90">
                    {active.price != null && <span>{formatINR(active.price)}</span>}
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
          </div>
          )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
