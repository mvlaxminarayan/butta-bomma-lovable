import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Heart, Share2, ShoppingCart, Star, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useProductReviews } from "@/hooks/useProductReviews";
import type { Product } from "@/components/ProductCard";
import ProductReviews from "@/components/ProductReviews";
import { supabase } from "@/integrations/supabase/client";
import productMug from "@/assets/product-mug.jpg";
import productBasket from "@/assets/product-basket.jpg";
import productCuttingBoard from "@/assets/product-cutting-board.jpg";

// Enhanced product data fetching from database
const getProductById = async (id: string): Promise<(Product & { 
  images: string[]; 
  description: string; 
  features: string[]; 
  specifications: Record<string, string>;
}) | undefined> => {
  try {
    console.log("Fetching product with ID:", id);
    
    const { data: product, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    console.log("Query result:", { product, error });

    if (error) {
      console.error("Error fetching product:", error);
      return undefined;
    }

    if (!product) {
      console.log("No product found for ID:", id);
      return undefined;
    }

    // Map database image name to imported asset
    let productImage = productMug; // default fallback
    if (product.image_url) {
      switch (product.image_url) {
        case 'product-mug.jpg':
          productImage = productMug;
          break;
        case 'product-basket.jpg':
          productImage = productBasket;
          break;
        case 'product-cutting-board.jpg':
          productImage = productCuttingBoard;
          break;
        default:
          productImage = productMug;
      }
    }

    // Enhanced product data based on category and name
    const getEnhancedData = (product: any) => {
      const name = product.name.toLowerCase();
      
      if (name.includes('mug') || name.includes('ceramic')) {
        return {
          features: [
            "100% handcrafted ceramic",
            "Microwave and dishwasher safe", 
            "12 oz capacity",
            "Comfortable ergonomic handle",
            "Lead-free glaze"
          ],
          specifications: {
            "Material": "High-quality ceramic",
            "Capacity": "12 oz (355ml)",
            "Dimensions": "4.5\" H x 3.5\" W",
            "Weight": "0.8 lbs",
            "Care": "Dishwasher and microwave safe"
          }
        };
      } else if (name.includes('basket') || name.includes('woven')) {
        return {
          features: [
            "Handwoven natural materials",
            "Sustainable and eco-friendly",
            "Sturdy construction", 
            "Versatile storage solution",
            "Beautiful decorative accent"
          ],
          specifications: {
            "Material": "Natural woven fibers",
            "Dimensions": "16\" L x 12\" W x 10\" H",
            "Weight": "2.5 lbs",
            "Care": "Spot clean only"
          }
        };
      } else if (name.includes('cutting board') || name.includes('board')) {
        return {
          features: [
            "Live edge design",
            "Food-safe finish",
            "Sustainably sourced hardwood",
            "Natural wood grain patterns",
            "Dual-purpose: cutting and serving"
          ],
          specifications: {
            "Material": "Hardwood (Walnut/Maple)",
            "Dimensions": "18\" L x 12\" W x 1.5\" H", 
            "Weight": "4.2 lbs",
            "Care": "Hand wash only, oil monthly"
          }
        };
      } else {
        // Default enhanced data
        return {
          features: [
            "Handcrafted quality",
            "Unique design",
            "Durable construction",
            "Artisan made",
            "Premium materials"
          ],
          specifications: {
            "Material": "Premium quality materials",
            "Care": "Follow care instructions",
            "Origin": "Handcrafted"
          }
        };
      }
    };

    const enhancedData = getEnhancedData(product);

    const result = {
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: productImage,
      images: [productImage, productImage, productImage], // In real app, would have multiple angles
      category: product.category || "Uncategorized",
      inStock: product.in_stock,
      description: product.description || `Beautiful ${product.name.toLowerCase()} crafted with attention to detail. Each piece is unique and brings character to your space.`,
      rating: 0, // Will be updated from reviews
      reviews: 0, // Will be updated from reviews
      features: enhancedData.features,
      specifications: enhancedData.specifications
    };

    console.log("Returning product:", result);
    return result;
  } catch (error) {
    console.error("Unexpected error fetching product:", error);
    return undefined;
  }
};

interface ProductDetailProps {
  onAddToCart: (product: Product, quantity: number) => void;
}

const ProductDetail = ({ onAddToCart }: ProductDetailProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<(Product & { 
    images: string[]; 
    description: string; 
    features: string[]; 
    specifications: Record<string, string>;
  }) | null>(null);
  const [loading, setLoading] = useState(true);

  const { averageRating, reviewCount } = useProductReviews(id || "");

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setProduct(null);
        setLoading(false);
        return;
      }

      try {
        const fetchedProduct = await getProductById(id);
        if (fetchedProduct) {
          // Update product with current review data
          setProduct({
            ...fetchedProduct,
            rating: averageRating,
            reviews: reviewCount
          });
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error("Error loading product:", error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, averageRating, reviewCount]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading Product...</h1>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Button onClick={() => navigate("/")} variant="outline">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const isOnSale = product.originalPrice && product.originalPrice > product.price;

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
    toast({
      title: "Added to cart",
      description: `${quantity} x ${product.name} added to your cart`,
    });
  };

  const updateQuantity = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= 10) {
      setQuantity(newQuantity);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Shop
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square rounded-xl overflow-hidden bg-product-card">
              <img
                src={product.images[selectedImageIndex]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Thumbnail Images */}
            <div className="flex gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    index === selectedImageIndex
                      ? "border-primary"
                      : "border-transparent hover:border-border"
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} view ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <Badge variant="secondary" className="mb-2">
                {product.category}
              </Badge>
              {isOnSale && (
                <Badge className="ml-2 bg-sale-price text-white">
                  Sale
                </Badge>
              )}
              <h1 className="text-3xl font-bold text-card-foreground mt-2">
                {product.name}
              </h1>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(product.rating)
                        ? "fill-rating text-rating"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
                <span className="ml-2 font-medium">{product.rating}</span>
              </div>
              <span className="text-muted-foreground">
                ({product.reviews} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-price">
                ${product.price}
              </span>
              {isOnSale && (
                <span className="text-xl text-muted-foreground line-through">
                  ${product.originalPrice}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-muted-foreground leading-relaxed">
              {product.description}
            </p>

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="font-medium">Quantity:</span>
                <div className="flex items-center border border-border rounded-md">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateQuantity(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="px-4 py-2 min-w-[60px] text-center">
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateQuantity(quantity + 1)}
                    disabled={quantity >= 10}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  size="lg"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart - ${(product.price * quantity).toFixed(2)}
                </Button>
                <Button variant="outline" size="lg">
                  <Heart className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="lg">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Stock Status */}
            {product.inStock ? (
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <span className="text-sm font-medium">In Stock</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600">
                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                <span className="text-sm font-medium">Out of Stock</span>
              </div>
            )}
          </div>
        </div>

        {/* Product Details */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Features */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Features</h3>
              <ul className="space-y-2">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></div>
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Specifications */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Specifications</h3>
              <div className="space-y-3">
                {Object.entries(product.specifications).map(([key, value], index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{key}:</span>
                      <span className="text-muted-foreground">{value}</span>
                    </div>
                    {index < Object.entries(product.specifications).length - 1 && (
                      <Separator className="mt-3" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <ProductReviews productId={product.id} productName={product.name} />
        </div>
      </main>
    </div>
  );
};

export default ProductDetail;