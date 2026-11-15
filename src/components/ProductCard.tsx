import { useEffect, useState } from "react";
import { Heart, ShoppingCart, Star, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toggleWishlist } from "@/lib/wishlist";
import { formatINR } from "@/lib/pricing";
import { useWishlistIds } from "@/hooks/useWishlist";
import { canPurchaseProduct } from "@/lib/productAvailability";

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  rating: number;
  reviews: number;
  category: string;
  inStock: boolean;
  stockQuantity?: number | null;
  featured?: boolean;
  weight_grams?: number | null;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

const ProductCard = ({ product, onAddToCart, onViewDetails }: ProductCardProps) => {
  const isOnSale = product.originalPrice && product.originalPrice > product.price;
  const photos = (product.images && product.images.length > 0 ? product.images : [product.image]).filter(Boolean);
  const hasMultiple = photos.length > 1;
  const [photoIndex, setPhotoIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const saved = useWishlistIds().includes(product.id);

  // Auto-slide photos; pause on hover and when the customer prefers reduced motion.
  useEffect(() => {
    if (!hasMultiple || hovered) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Stagger start times so cards don't all flip at once.
    const offset = Math.abs([...product.id].reduce((s, ch) => s + ch.charCodeAt(0), 0)) % 3000;
    let interval: ReturnType<typeof setInterval> | undefined;
    const kickoff = setTimeout(() => {
      setPhotoIndex((i) => (i + 1) % photos.length);
      interval = setInterval(() => setPhotoIndex((i) => (i + 1) % photos.length), 3500);
    }, 1500 + offset);
    return () => { clearTimeout(kickoff); if (interval) clearInterval(interval); };
  }, [hasMultiple, hovered, photos.length, product.id]);

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex((i) => (i - 1 + photos.length) % photos.length);
  };

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex((i) => (i + 1) % photos.length);
  };

  return (
    <div
      className="group relative bg-product-card hover:bg-product-card-hover rounded-xl shadow-[var(--shadow-product)] hover:shadow-[var(--shadow-product-hover)] transition-all duration-300 hover:-translate-y-2 cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Product Image */}
      <div className="relative overflow-hidden rounded-t-xl protected-img" onContextMenu={(e) => e.preventDefault()}>
        <img
          src={photos[photoIndex] || product.image}
          alt={product.name}
          draggable={false}
          className="w-full h-40 sm:h-64 object-cover transition-transform duration-500 group-hover:scale-110"
          onClick={() => onViewDetails(product)}
        />
        {hasMultiple && (
          <>
            {/* Prev / Next arrows */}
            <button
              aria-label="Previous photo"
              onClick={prevPhoto}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-background transition-all duration-200 opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            <button
              aria-label="Next photo"
              onClick={nextPhoto}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-background transition-all duration-200 opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="h-5 w-5 text-foreground" />
            </button>
            {/* Photo counter */}
            <span className="absolute bottom-3 right-3 text-xs font-medium px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-sm text-foreground">
              {photoIndex + 1}/{photos.length}
            </span>
          </>
        )}

        {/* Category + Sale badges (top-left) */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col items-start gap-1 max-w-[65%] pointer-events-none">
          {product.category && (
            <Badge variant="secondary" className="text-[10px] sm:text-xs bg-background/85 backdrop-blur-sm truncate max-w-full">
              {product.category}
            </Badge>
          )}
          {isOnSale && (
            <Badge className="bg-sale-price text-primary-foreground font-semibold text-[10px] sm:text-xs">Sale</Badge>
          )}
        </div>

        {/* Wishlist Button */}
        <Button
          variant="ghost"
          size="icon"
          aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={saved}
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-3 right-3 z-10 bg-background/80 backdrop-blur-sm hover:bg-background transition-all duration-300 ${
            hasMultiple && !saved ? "opacity-0 group-hover:opacity-100" : ""
          }`}
        >
          <Heart className={`h-4 w-4 ${saved ? "fill-accent text-accent" : ""}`} />
        </Button>

        {/* Stock Status */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center pointer-events-none">
            <Badge variant="destructive">Out of Stock</Badge>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-2.5 sm:p-4 space-y-2 sm:space-y-3">
        {/* Row 1: name and price */}
        <div className="flex items-start justify-between gap-2">
          <h3
            className="text-sm sm:text-base font-semibold text-card-foreground line-clamp-2 hover:text-primary transition-colors cursor-pointer min-w-0"
            onClick={() => onViewDetails(product)}
          >
            {product.name}
          </h3>
          <div className="text-right shrink-0">
            <div className="text-sm sm:text-lg font-bold text-price leading-tight">{formatINR(product.price)}</div>
            {isOnSale && (
              <div className="text-[11px] sm:text-sm text-muted-foreground line-through">{formatINR(product.originalPrice)}</div>
            )}
          </div>
        </div>

        {/* Rating: tap the stars to rate */}
        <button
          type="button"
          aria-label={`Rate ${product.name}`}
          title="Rate this product"
          onClick={(e) => {
            e.stopPropagation();
            sessionStorage.setItem(`rate:${product.id}`, "1");
            onViewDetails(product);
          }}
          className="flex items-center gap-1 sm:gap-2 group/rate"
        >
          <span className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                  i < Math.floor(product.rating) ? "fill-rating text-rating" : "text-muted-foreground"
                }`}
              />
            ))}
          </span>
          <span className="text-xs sm:text-sm text-muted-foreground group-hover/rate:text-primary group-hover/rate:underline">
            {product.reviews > 0 ? `(${product.reviews})` : "Rate"}
          </span>
        </button>

        {/* Row 2: Buy now and Add to cart */}
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          <Button
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              if (!canPurchaseProduct(product)) return;
              sessionStorage.setItem(`buynow:${product.id}`, "1");
              onViewDetails(product);
            }}
            disabled={!canPurchaseProduct(product)}
            className="h-9 px-1 text-xs sm:text-sm border-primary text-primary hover:bg-primary/10 hover:text-primary"
          >
            <Zap className="hidden min-[400px]:block h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
            Buy now
          </Button>
          <Button
            onClick={(e) => { e.stopPropagation(); if (canPurchaseProduct(product)) onAddToCart(product); }}
            disabled={!canPurchaseProduct(product)}
            className="h-9 px-1 text-xs sm:text-sm bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
            <span className="sm:hidden">Cart</span>
            <span className="hidden sm:inline">Add to cart</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
