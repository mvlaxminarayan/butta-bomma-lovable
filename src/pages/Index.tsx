import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import AnnouncementBar from "@/components/AnnouncementBar";
import Hero from "@/components/Hero";


import ProductGrid from "@/components/ProductGrid";
import OurStory from "@/components/OurStory";
import Footer from "@/components/Footer";
import Cart, { CartItem } from "@/components/Cart";
import { Product } from "@/components/ProductCard";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem("cart") || "[]"); } catch { return []; }
  });
  const [isCartOpen, setIsCartOpen] = useState(
    () => new URLSearchParams(window.location.search).get("cart") === "open"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [wishlistOnly, setWishlistOnly] = useState(
    () => new URLSearchParams(window.location.search).get("wishlist") === "1"
  );
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("wishlist") === "1") setWishlistOnly(true);
  }, [location.search]);

  useEffect(() => {
    const target = (location.state as { scrollTo?: string } | null)?.scrollTo;
    if (!target) return;
    const timer = setTimeout(() => {
      document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 350);
    return () => clearTimeout(timer);
  }, [location.state]);

  useEffect(() => {
    if (!wishlistOnly) return;
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
        item.id === id ? { ...item, quantity } : item
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

  const handleViewDetails = (product: Product) => {
    // Navigate to product detail page
    window.location.href = `/product/${product.id}`;
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <Header 
        cartItems={totalItems}
        onCartClick={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <Hero />

      <ProductGrid 

        onAddToCart={addToCart}
        onViewDetails={handleViewDetails}
        searchQuery={searchQuery}
        onClearSearch={() => setSearchQuery("")}
        wishlistOnly={wishlistOnly}
        onExitWishlist={exitWishlist}
      />
      <OurStory />
      <Footer />
      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
      />
    </div>
  );
};

export default Index;