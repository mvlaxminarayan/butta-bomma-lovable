import { useState } from "react";
import { Heart, ShoppingCart, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex((i) => (i - 1 + photos.length) % photos.length);
  };

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex((i) => (i + 1) % photos.length);
  };

  return (
    <div className="group relative bg-product-card hover:bg-product-card-hover rounded-xl shadow-[var(--shadow-product)] hover:shadow-[var(--shadow-product-hover)] transition-all duration-300 hover:-translate-y-2 cursor-pointer">
      {/* Product Image */}
      <div className="relative overflow-hidden rounded-t-xl">
        <img
          src={photos[photoIndex] || product.image}
          alt={product.name}
          className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
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

        {/* Sale Badge */}
        {isOnSale && (
          <Badge className="absolute top-3 left-3 bg-sale-price text-white font-semibold">
            Sale
          </Badge>
        )}

        {/* Wishlist Button */}
        <Button
          variant="ghost"
          size="icon"
          className={`absolute top-3 right-3 bg-background/80 backdrop-blur-sm hover:bg-background transition-all duration-300 ${
            hasMultiple ? "opacity-0 group-hover:opacity-100" : ""
          }`}
        >
          <Heart className="h-4 w-4" />
        </Button>

        {/* Stock Status */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="destructive">Out of Stock</Badge>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 space-y-3">
        <div>
          <Badge variant="secondary" className="text-xs mb-2">
            {product.category}
          </Badge>
          <h3 
            className="font-semibold text-card-foreground line-clamp-2 hover:text-primary transition-colors cursor-pointer"
            onClick={() => onViewDetails(product)}
          >
            {product.name}
          </h3>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.floor(product.rating)
                    ? "fill-rating text-rating"
                    : "text-muted-foreground"
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            ({product.reviews})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-price">
              ${product.price}
            </span>
            {isOnSale && (
              <span className="text-sm text-muted-foreground line-through">
                ${product.originalPrice}
              </span>
            )}
          </div>
        </div>

        {/* Add to Cart Button */}
        <Button
          onClick={() => onAddToCart(product)}
          disabled={!product.inStock}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 hover:shadow-lg"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to Cart
        </Button>
      </div>
    </div>
  );
};

export default ProductCard;
