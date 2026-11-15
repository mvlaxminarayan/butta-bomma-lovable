import { useState, useEffect, useMemo, useRef } from "react";
import { X } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import ProductCard, { Product } from "./ProductCard";
import { Button } from "./ui/button";
import { getProductReviewsSync } from "@/hooks/useProductReviews";
import { resolveImageUrls, productImageRefs, LOCAL_ASSETS, FALLBACK_IMAGE } from "@/lib/productImages";
import { getWishlistIds } from "@/lib/wishlist";
import type { ShopBrowseState } from "@/lib/shopBrowse";
import { fetchCatalog } from "@/lib/catalog";

interface ProductGridProps {
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product, gridState: { page: number; sort: string }) => void;
  restoredBrowse?: ShopBrowseState;
  onBrowseChange?: (gridState: { page: number; sort: string }) => void;
  sort?: string;
  searchQuery?: string;
  onClearSearch?: () => void;
  category?: string;
  onCategoryChange?: (c: string) => void;
  wishlistOnly?: boolean;
  onExitWishlist?: () => void;
  featuredOnly?: boolean;
  onExitFeatured?: () => void;
}

// No sample products: show only real catalog items.
const fallbackProducts: Product[] = [];

// Get products with review data from database or fallback
const getProductsWithReviews = async (): Promise<Product[]> => {
  try {
    console.log("Fetching products from database...");
    
    const { data: products, error } = await fetchCatalog();

    console.log("Products query result:", { products, error });

    if (error) {
      console.error("Error fetching products:", error);
      // Use fallback products if database fails
      return fallbackProducts.map(product => {
        const { averageRating, reviewCount } = getProductReviewsSync(product.id);
        return {
          ...product,
          rating: averageRating || 0,
          reviews: reviewCount
        };
      });
    }

    // If no products in database, use fallback
    if (!products || products.length === 0) {
      console.log("No products in database, using fallback");
      return fallbackProducts.map(product => {
        const { averageRating, reviewCount } = getProductReviewsSync(product.id);
        return {
          ...product,
          rating: averageRating || 0,
          reviews: reviewCount
        };
      });
    }

    const allRefs = products.map((p: any) => productImageRefs(p));
    const flatRefs = allRefs.flat().filter(Boolean);
    const urls = await resolveImageUrls(Array.from(new Set(flatRefs)));
    const urlByRef: Record<string, string> = {};
    Array.from(new Set(flatRefs)).forEach((r: string, i: number) => { urlByRef[r] = urls[i]; });

    const resolveFor = (product: any, i: number): string[] => {
      const refs = allRefs[i];
      const resolved = refs.map((r: string) => urlByRef[r]).filter(Boolean);
      if (resolved.length === 0) {
        const legacy = LOCAL_ASSETS[refs[0]] || FALLBACK_IMAGE;
        return [legacy];
      }
      return resolved;
    };

    return products.map((product: any, i: number) => {
      const { averageRating, reviewCount } = getProductReviewsSync(product.id);
      const images = resolveFor(product, i);
      return {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        image: images[0] || FALLBACK_IMAGE,
        images,
        category: (product.category || "").trim() || "Uncategorized",
        inStock: product.in_stock,
        featured: !!product.is_featured,
        weight_grams: product.weight_grams,
        rating: averageRating || 0,
        reviews: reviewCount
      };
    });
  } catch (error) {
    console.error("Unexpected error fetching products:", error);
    // Use fallback products on any error
    return fallbackProducts.map(product => {
      const { averageRating, reviewCount } = getProductReviewsSync(product.id);
      return {
        ...product,
        rating: averageRating || 0,
        reviews: reviewCount
      };
    });
  }
};

const ProductGrid = ({ onAddToCart, onViewDetails, restoredBrowse, onBrowseChange, sort: sortProp, searchQuery = "", onClearSearch, category: categoryProp, onCategoryChange, wishlistOnly = false, onExitWishlist, featuredOnly = false, onExitFeatured }: ProductGridProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchProducts = async () => {
      try {
        const productsWithReviews = await getProductsWithReviews();
        if (!cancelled) setProducts(productsWithReviews);
      } catch (e) {
        console.error("Failed to load products:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProducts();
    return () => { cancelled = true; };
  }, []);

  const [localCategory, setLocalCategory] = useState<string>("All");
  const category = categoryProp ?? localCategory;
  const setCategory = (c: string) => { setLocalCategory(c); onCategoryChange?.(c); };
  const [sort] = useState<string>(restoredBrowse?.sort ?? sortProp ?? "featured");
  const [page, setPage] = useState(restoredBrowse?.page ?? 1);
  const initialFilters = useRef(true);
  const restoredScroll = useRef(false);
  const PAGE_SIZE = 12;

  const [wishlistIds, setWishlistIds] = useState<string[]>(() => getWishlistIds());

  useEffect(() => {
    const update = () => setWishlistIds(getWishlistIds());
    window.addEventListener("wishlist-changed", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("wishlist-changed", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  const query = searchQuery.trim().toLowerCase();

  const visibleProducts = useMemo(() => {
    let list = products.filter((p) =>
      (!wishlistOnly || wishlistIds.includes(p.id)) &&
      (!featuredOnly || wishlistOnly || p.featured) &&
      (category === "All" || (p.category || "Uncategorized") === category) &&
      (!query || p.name.toLowerCase().includes(query) || (p.category || "").toLowerCase().includes(query))
    );
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    else if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, category, query, sort, wishlistOnly, wishlistIds, featuredOnly]);

  useEffect(() => {
    if (initialFilters.current) { initialFilters.current = false; return; }
    setPage(1);
  }, [category, query, sort, wishlistOnly, featuredOnly]);

  useEffect(() => {
    if (loading || !restoredBrowse || restoredScroll.current) return;
    const frame = requestAnimationFrame(() => {
      window.scrollTo({ top: restoredBrowse.scrollY, behavior: "instant" });
      restoredScroll.current = true;
    });
    return () => cancelAnimationFrame(frame);
  }, [loading, restoredBrowse]);

  const totalPages = Math.max(1, Math.ceil(visibleProducts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  useEffect(() => {
    if (!loading) onBrowseChange?.({ page: currentPage, sort });
  }, [loading, currentPage, sort, onBrowseChange]);
  const pageItems = visibleProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const goTo = (p: number) => {
    setPage(p);
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return (
      <section className="py-10 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Our Handcrafted <span className="text-primary">Collection</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Loading our handcrafted collection...
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card rounded-lg p-4 animate-pulse">
                <div className="bg-muted h-48 rounded-lg mb-4"></div>
                <div className="bg-muted h-4 rounded mb-2"></div>
                <div className="bg-muted h-4 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const pill = (active: boolean) =>
    `px-4 py-2 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
      active ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-muted"
    }`;

  const pagination = (position: "top" | "bottom") => (
    <nav aria-label={`Product pages (${position})`} className={`flex items-center justify-center gap-2 flex-wrap ${position === "bottom" ? "mt-10" : ""}`}>
      <Button variant="outline" className={pill(false)} disabled={currentPage <= 1} onClick={() => goTo(currentPage - 1)}>
        ‹ Previous
      </Button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <Button key={p} variant={p === currentPage ? "default" : "outline"} className={pill(p === currentPage)} onClick={() => goTo(p)} aria-current={p === currentPage ? "page" : undefined}>
          {p}
        </Button>
      ))}
      <Button variant="outline" className={pill(false)} disabled={currentPage >= totalPages} onClick={() => goTo(currentPage + 1)}>
        Next ›
      </Button>
    </nav>
  );

  return (
    <section id="products" className="pt-4 pb-10 bg-background scroll-mt-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {wishlistOnly ? (
              <>
                Your <span className="text-primary">Wishlist</span>
              </>
            ) : (
              <>
                Our Handcrafted <span className="text-primary">Collection</span>
              </>
            )}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {wishlistOnly
              ? "Items you've saved for later — tap the heart on any product to add more"
              : "Explore every piece in our shop — filter by category to find your favourite"}
          </p>
        </div>

        {featuredOnly && !wishlistOnly && (
          <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/10 px-5 py-3">
            <span className="text-sm md:text-base font-medium text-primary">
              Showing Featured Artisan Creations ({visibleProducts.length})
            </span>
            <button
              onClick={() => onExitFeatured?.()}
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              <X className="w-4 h-4" /> View all items
            </button>
          </div>
        )}

        {visibleProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              {wishlistOnly
                ? "Your wishlist is empty. Tap the heart on any product to save it here."
                : `No products found${query ? ` for "${searchQuery}"` : " in this category"}.`}
            </p>
          </div>
        ) : (
          <>
            <div className="grid items-center gap-x-4 gap-y-2 mb-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
              <p className="text-sm text-muted-foreground shrink-0">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, visibleProducts.length)} of {visibleProducts.length}
              </p>
              {pagination("top")}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pageItems.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  onViewDetails={(selected) => onViewDetails(selected, { page: currentPage, sort })}
                />
              ))}
            </div>
          </>
        )}

        {visibleProducts.length > 0 && pagination("bottom")}

        {(wishlistOnly || featuredOnly || query || category !== "All") && (
          <div className="text-center mt-8">
            <button
              onClick={() => { setCategory("All"); onClearSearch?.(); onExitWishlist?.(); onExitFeatured?.(); }}
              className="text-primary font-semibold hover:underline transition-all duration-300"
            >
              View All Products →
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductGrid;