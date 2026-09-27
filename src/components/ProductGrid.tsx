import { useState, useEffect, useMemo } from "react";
import { ChevronDown, X } from "lucide-react";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };
import { supabase } from "@/integrations/supabase/client";
import ProductCard, { Product } from "./ProductCard";
import productMug from "@/assets/product-mug.jpg";
import productBasket from "@/assets/product-basket.jpg";
import productCuttingBoard from "@/assets/product-cutting-board.jpg";
import { getProductReviewsSync } from "@/hooks/useProductReviews";
import { resolveImageUrls, productImageRefs, LOCAL_ASSETS, FALLBACK_IMAGE } from "@/lib/productImages";

interface ProductGridProps {
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  searchQuery?: string;
  onClearSearch?: () => void;
}

// Fallback product data for when database is empty
const fallbackProducts = [
  {
    id: "fallback-1",
    name: "Handcrafted Ceramic Mug",
    price: 28,
    originalPrice: 35,
    image: productMug,
    images: [productMug],
    category: "Ceramics",
    inStock: true,
  },
  {
    id: "fallback-2",
    name: "Woven Storage Basket",
    price: 45,
    image: productBasket,
    images: [productBasket],
    category: "Home Decor",
    inStock: true,
  },
  {
    id: "fallback-3",
    name: "Live Edge Cutting Board",
    price: 68,
    originalPrice: 85,
    image: productCuttingBoard,
    images: [productCuttingBoard],
    category: "Kitchen",
    inStock: true,
  },
];

// Get products with review data from database or fallback
const getProductsWithReviews = async (): Promise<Product[]> => {
  try {
    console.log("Fetching products from database...");
    
    const { data: products, error } = await (supabase as any)
      .schema("api")
      .from("products")
      .select("*")
      .order("in_stock", { ascending: false })
      .order("created_at", { ascending: false });

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
        category: product.category || "Uncategorized",
        inStock: product.in_stock,
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

const ProductGrid = ({ onAddToCart, onViewDetails, searchQuery = "", onClearSearch }: ProductGridProps) => {
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

  const [category, setCategory] = useState<string>("All");
  const [sort, setSort] = useState<string>("featured");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  const [galleryOpen, setGalleryOpen] = useState(false);

  const query = searchQuery.trim().toLowerCase();

  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => { const c = p.category || "Uncategorized"; counts[c] = (counts[c] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));
  }, [products]);

  const visibleProducts = useMemo(() => {
    let list = products.filter((p) =>
      (category === "All" || (p.category || "Uncategorized") === category) &&
      (!query || p.name.toLowerCase().includes(query) || (p.category || "").toLowerCase().includes(query))
    );
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    else if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, category, query, sort]);

  useEffect(() => { setPage(1); }, [category, query, sort]);

  const totalPages = Math.max(1, Math.ceil(visibleProducts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = visibleProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const goTo = (p: number) => {
    setPage(p);
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Featured <span className="text-primary">Collection</span>
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

  return (
    <section id="products" className="py-16 bg-background scroll-mt-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Featured <span className="text-primary">Collection</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Carefully curated handmade items that bring warmth and character to your home
          </p>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
          <div className="relative flex-1 min-w-0">
            {rail.canScroll && !rail.atStart && (
              <>
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
                <button
                  aria-label="Scroll categories left"
                  onClick={() => scrollRail(-1)}
                  className="absolute left-1 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full border border-border bg-card shadow-sm flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </>
            )}

            <nav
              ref={railRef}
              onScroll={updateRail}
              aria-label="Categories"
              className="no-scrollbar flex gap-2 overflow-x-auto pb-2 pr-16 scroll-smooth"
            >
              <button data-cat="All" className={pill(category === "All")} onClick={() => setCategory("All")}>
                All ({products.length})
              </button>
              {categories.map(([c, n]) => (
                <button key={c} data-cat={c} className={pill(category === c)} onClick={() => setCategory(c)}>
                  {c} ({n})
                </button>
              ))}
            </nav>

            {rail.canScroll && !rail.atEnd && (
              <div className="absolute right-14 top-0 bottom-2 w-10 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
            )}
            <button
              onClick={() => setShowAll((v) => !v)}
              aria-expanded={showAll}
              aria-label={showAll ? "Close all categories" : "Show all categories"}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1.5 h-9 px-3 rounded-full border border-border bg-card shadow-sm text-xs font-semibold uppercase tracking-wider text-foreground hover:bg-muted transition-colors whitespace-nowrap"
            >
              {showAll ? <X className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
              {showAll ? "Close" : "All"}
            </button>
          </div>
          <select
            aria-label="Sort products"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-10 rounded-md border border-border bg-card px-3 text-sm"
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name">Name: A–Z</option>
          </select>
        </div>

        {showAll && (
          <div className="mb-8 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <button className={pill(category === "All")} onClick={() => setCategory("All")}>
                All ({products.length})
              </button>
              {categories.map(([c, n]) => (
                <button key={c} className={pill(category === c)} onClick={() => setCategory(c)}>
                  {c} ({n})
                </button>
              ))}
            </div>
          </div>
        )}

        {visibleProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              No products found{query ? ` for "${searchQuery}"` : " in this category"}.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, visibleProducts.length)} of {visibleProducts.length}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pageItems.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  onViewDetails={onViewDetails}
                />
              ))}
            </div>
          </>
        )}

        {visibleProducts.length > 0 && (
          <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
            <button className={pill(false) + " disabled:opacity-50 disabled:pointer-events-none"} disabled={currentPage <= 1} onClick={() => goTo(currentPage - 1)}>
              ‹ Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} className={pill(p === currentPage)} onClick={() => goTo(p)} aria-current={p === currentPage ? "page" : undefined}>
                {p}
              </button>
            ))}
            <button className={pill(false) + " disabled:opacity-50 disabled:pointer-events-none"} disabled={currentPage >= totalPages} onClick={() => goTo(currentPage + 1)}>
              Next ›
            </button>
          </div>
        )}

        {(query || category !== "All") && (
          <div className="text-center mt-8">
            <button
              onClick={() => { setCategory("All"); onClearSearch?.(); }}
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