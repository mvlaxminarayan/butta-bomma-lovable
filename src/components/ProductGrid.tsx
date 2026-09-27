import { useState, useEffect, useMemo } from "react";
import { ChevronDown, X } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import ProductCard, { Product } from "./ProductCard";
import productMug from "@/assets/product-mug.jpg";
import productBasket from "@/assets/product-basket.jpg";
import productCuttingBoard from "@/assets/product-cutting-board.jpg";
import { getProductReviewsSync } from "@/hooks/useProductReviews";
import { resolveImageUrls, productImageRefs, LOCAL_ASSETS, FALLBACK_IMAGE } from "@/lib/productImages";
import { getWishlistIds } from "@/lib/wishlist";

interface ProductGridProps {
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  searchQuery?: string;
  onClearSearch?: () => void;
  wishlistOnly?: boolean;
  onExitWishlist?: () => void;
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

const ProductGrid = ({ onAddToCart, onViewDetails, searchQuery = "", onClearSearch, wishlistOnly = false, onExitWishlist }: ProductGridProps) => {
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

  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => { const c = p.category || "Uncategorized"; counts[c] = (counts[c] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));
  }, [products]);

  const visibleProducts = useMemo(() => {
    let list = products.filter((p) =>
      (!wishlistOnly || wishlistIds.includes(p.id)) &&
      (category === "All" || (p.category || "Uncategorized") === category) &&
      (!query || p.name.toLowerCase().includes(query) || (p.category || "").toLowerCase().includes(query))
    );
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    else if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, category, query, sort, wishlistOnly, wishlistIds]);

  useEffect(() => { setPage(1); }, [category, query, sort, wishlistOnly]);

  const totalPages = Math.max(1, Math.ceil(visibleProducts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
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

  const catLink = (label: string, count: number, active: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      className={`w-full text-sm text-left flex justify-between items-baseline transition-colors ${
        active ? "text-primary font-medium" : "text-foreground/70 hover:text-primary"
      }`}
    >
      {label}
      <span className="text-[10px] font-light text-muted-foreground">({count})</span>
    </button>
  );

  const pill = (active: boolean) =>
    `px-4 py-2 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
      active ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-muted"
    }`;

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
                Featured <span className="text-primary">Collection</span>
              </>
            )}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {wishlistOnly
              ? "Items you've saved for later — tap the heart on any product to add more"
              : "Carefully curated handmade items that bring warmth and character to your home"}
          </p>
        </div>

        {/* Category organization bar */}
        <div className="border-y border-border py-5 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <button
            onClick={() => setGalleryOpen((v) => !v)}
            aria-expanded={galleryOpen}
            className="group flex items-center gap-3 cursor-pointer shrink-0"
          >
            <div className="flex flex-col gap-1 text-primary group-hover:text-primary/80 transition-colors">
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-foreground group-hover:text-primary transition-colors">
              Browse Collections
            </span>
          </button>

          <div className="hidden lg:flex items-center gap-4 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Currently viewing
            </span>
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-primary">
              <span className="text-sm font-medium whitespace-nowrap">
                {wishlistOnly ? "Your Wishlist" : category === "All" ? "All Items" : category}
              </span>
              {wishlistOnly && (
                <button
                  onClick={() => onExitWishlist?.()}
                  aria-label="Exit wishlist view"
                  className="p-0.5 hover:bg-primary/15 rounded-full transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              {!wishlistOnly && category !== "All" && (
                <button
                  onClick={() => setCategory("All")}
                  aria-label="Clear category filter"
                  className="p-0.5 hover:bg-primary/15 rounded-full transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-8">
            <p className="hidden sm:block text-sm text-muted-foreground">
              Showing <span className="font-bold text-foreground">{visibleProducts.length}</span> Handmade Pieces
            </p>
            <div className="flex items-center gap-2 border-l border-border pl-8">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sort by</span>
              <div className="relative">
                <select
                  aria-label="Sort products"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
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
        </div>

        {/* Expanded category gallery */}
        {galleryOpen && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 py-6 mb-8 border-t border-border">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                All Collections
              </h3>
              <ul className="space-y-2.5">
                <li>{catLink("All Items", products.length, category === "All", () => { setCategory("All"); setGalleryOpen(false); })}</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                Browse by Category
              </h3>
              <ul className="space-y-2.5">
                {categories.map(([c, n]) => (
                  <li key={c}>
                    {catLink(c, n, category === c, () => { setCategory(c); setGalleryOpen(false); })}
                  </li>
                ))}
              </ul>
            </div>
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

        {(wishlistOnly || query || category !== "All") && (
          <div className="text-center mt-8">
            <button
              onClick={() => { setCategory("All"); onClearSearch?.(); onExitWishlist?.(); }}
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