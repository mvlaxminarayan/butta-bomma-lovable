import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import AnnouncementBar from "@/components/AnnouncementBar";
import Hero from "@/components/Hero";


import ProductGrid from "@/components/ProductGrid";
import OurStory from "@/components/OurStory";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import { CategoryTiles, TrustBar, MakerBanner } from "@/components/HomeSections";
import Cart, { CartItem } from "@/components/Cart";
import { Product } from "@/components/ProductCard";
import { useToast } from "@/hooks/use-toast";
import { canPurchaseProduct, maxPurchasable, clampQuantity } from "@/lib/productAvailability";
import { shopReturnLocation, type ShopBrowseState } from "@/lib/shopBrowse";

const Index = () => {
  const location = useLocation();
  const [restoredBrowse] = useState(() =>
    (location.state as { shopBrowse?: ShopBrowseState } | null)?.shopBrowse
  );
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem("cart") || "[]"); } catch { return []; }
  });
  const [isCartOpen, setIsCartOpen] = useState(
    () => ["open", "checkout"].includes(new URLSearchParams(window.location.search).get("cart") || "")
  );
  const [cartAtCheckout, setCartAtCheckout] = useState(
    () => new URLSearchParams(window.location.search).get("cart") === "checkout"
  );
  const [searchQuery, setSearchQuery] = useState(restoredBrowse?.searchQuery ?? "");
  const [category, setCategory] = useState(restoredBrowse?.category ?? "All");
  const [featuredOnly, setFeaturedOnly] = useState(restoredBrowse?.featuredOnly ?? false);
  const [wishlistOnly, setWishlistOnly] = useState(
    () => restoredBrowse?.wishlistOnly ?? new URLSearchParams(window.location.search).get("wishlist") === "1"
  );
  const navigate = useNavigate();
  const gridBrowse = useRef({ page: restoredBrowse?.page ?? 1, sort: restoredBrowse?.sort ?? "featured" });
  const [gridSort, setGridSort] = useState(gridBrowse.current.sort);
  const rememberGridBrowse = useCallback((state: { page: number; sort: string }) => {
    gridBrowse.current = state;
    setGridSort(state.sort);
  }, []);
  const handleSortChange = useCallback((sort: string) => {
    gridBrowse.current = { ...gridBrowse.current, sort };
    setGridSort(sort);
  }, []);
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("wishlist") === "1") setWishlistOnly(true);
    const cartParam = params.get("cart");
    if (cartParam === "open") { setIsCartOpen(true); setCartAtCheckout(false); }
    if (cartParam === "checkout") { setIsCartOpen(true); setCartAtCheckout(true); }
  }, [location.search]);

  const closeCart = () => {
    setIsCartOpen(false);
    const params = new URLSearchParams(location.search);
    if (params.has("cart")) {
      params.delete("cart");
      navigate({ pathname: "/", search: params.toString() }, { replace: true, state: location.state });
    }
  };

  useEffect(() => {
    const target = (location.state as { scrollTo?: string } | null)?.scrollTo;
    if (!target) return;
    const timer = setTimeout(() => {
      document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 350);
    return () => clearTimeout(timer);
  }, [location.state]);

  useEffect(() => {
    if (!wishlistOnly || restoredBrowse) return;
    const timer = setTimeout(() => {
      document.getElementById("products")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 350);
    return () => clearTimeout(timer);
  }, [wishlistOnly]);

  const exitWishlist = () => {
    setWishlistOnly(false);
    if (new URLSearchParams(location.search).get("wishlist")) {
      navigate("/", { replace: true });
    }
  };

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product: Product) => {
    if (!canPurchaseProduct(product)) return;
    const held = cartItems.find(item => item.id === product.id)?.quantity || 0;
    if (held >= maxPurchasable(product)) {
      toast({
        title: "Not enough stock",
        description: `Only ${maxPurchasable(product)} of ${product.name} available, and they're already in your cart.`,
        variant: "destructive",
      });
      return;
    }
    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });

    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity === 0) {
      removeFromCart(id);
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, quantity: Math.max(1, clampQuantity(item, quantity)) } : item
      )
    );
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Removed from cart",
      description: "Item has been removed from your cart.",
    });
  };

  const openProduct = (id: string, gridState = gridBrowse.current) => {
    const returnTo = shopReturnLocation(location.search, {
      searchQuery, category, featuredOnly, wishlistOnly,
      ...gridState, scrollY: window.scrollY,
    });
    // Save the same snapshot in history for the browser's Back button too.
    navigate({ pathname: returnTo.pathname, search: returnTo.search }, { replace: true, state: returnTo.state });
    navigate(`/product/${id}`, { state: { returnTo } });
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const handleViewDetails = (product: Product, gridState: { page: number; sort: string }) => openProduct(product.id, gridState);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen ">
      <Seo
        title="Buttabomma Crafts — Handcrafted Artisan Goods"
        description="Buttabomma Crafts celebrates heritage with authentic handcrafted treasures. Shop artisan toys, ceramics, textiles and home decor from Nandyal, Andhra Pradesh."
        path="/"
      />
      <AnnouncementBar />
      <Header 
        cartItems={totalItems}
        onCartClick={() => setIsCartOpen(true)}
      />
      <Hero onViewProduct={(id) => openProduct(id)} onViewFeatured={() => {
        setSearchQuery(""); setCategory("All"); setFeaturedOnly(true);
        setTimeout(() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
      }} />
      <TrustBar />
      <MakerBanner />
      <CategoryTiles
        onPick={(c) => { setSearchQuery(""); setFeaturedOnly(false); setCategory(c); setTimeout(() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" }), 50); }}
        activeCategory={category}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sort={gridSort}
        onSortChange={handleSortChange}
      />

      <ProductGrid 

        onAddToCart={addToCart}
        onViewDetails={handleViewDetails}
        restoredBrowse={restoredBrowse}
        onBrowseChange={rememberGridBrowse}
        sort={gridSort}
        searchQuery={searchQuery}
        category={category}
        onCategoryChange={setCategory}
        onClearSearch={() => setSearchQuery("")}
        wishlistOnly={wishlistOnly}
        onExitWishlist={exitWishlist}
        featuredOnly={featuredOnly}
        onExitFeatured={() => setFeaturedOnly(false)}
      />
      <OurStory />
      <Footer />
      <Cart
        isOpen={isCartOpen}
        onClose={closeCart}
        cartItems={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        startAtCheckout={cartAtCheckout}
      />
    </div>
  );
};

export default Index;
