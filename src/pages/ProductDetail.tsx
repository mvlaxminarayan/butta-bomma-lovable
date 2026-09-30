import { useParams, useNavigate, Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { useState, useEffect } from "react";
import { ArrowLeft, Heart, Share2, ShoppingCart, Star, Plus, Minus, RotateCcw, Zap } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useProductReviews } from "@/hooks/useProductReviews";
import type { Product } from "@/components/ProductCard";
import { formatINR } from "@/lib/pricing";
import ProductReviews from "@/components/ProductReviews";
import ProductQuestions from "@/components/ProductQuestions";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { resolveImageUrls, productImageRefs, FALLBACK_IMAGE } from "@/lib/productImages";
import { isWishlisted, toggleWishlist } from "@/lib/wishlist";

// Enhanced product data fetching from database
const getProductById = async (id: string): Promise<(Product & { 
  images: string[]; 
  description: string; 
  features: string[]; 
  specifications: Record<string, string>;
}) | undefined> => {
  try {
    console.log("Fetching product with ID:", id);
    
    const { data: product, error } = await (supabase as any)
      .schema("api")
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

    const resolved = (await resolveImageUrls(productImageRefs(product))).filter(Boolean);
    const productImages = resolved.length ? resolved : [FALLBACK_IMAGE];
    const productImage = productImages[0];

    const savedFeatures: string[] = Array.isArray(product.features) ? product.features.filter(Boolean) : [];
    const savedSpecs: Record<string, string> =
      product.specifications && typeof product.specifications === "object" && !Array.isArray(product.specifications) ? product.specifications : {};

    const result = {
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: productImage,
      images: productImages,
      category: product.category || "Uncategorized",
      inStock: product.in_stock,
      description: product.description || `Beautiful ${product.name.toLowerCase()} crafted with attention to detail. Each piece is unique and brings character to your space.`,
      rating: 0, // Will be updated from reviews
      reviews: 0, // Will be updated from reviews
      features: savedFeatures,
      specifications: savedSpecs
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
  const readCartCount = () => {
    try {
      return JSON.parse(localStorage.getItem("cart") || "[]").reduce((s: number, i: any) => s + (i.quantity || 0), 0);
    } catch { return 0; }
  };
  const [cartCount, setCartCount] = useState<number>(readCartCount);
  const { toast } = useToast();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [zoomScale, setZoomScale] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);


  const handleToggleWishlist = () => {
    if (!product) return;
    const nowSaved = toggleWishlist(product.id);
    setWishlisted(nowSaved);
    toast({
      title: nowSaved ? "Added to wishlist" : "Removed from wishlist",
      description: product.name,
    });
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied", description: "Share this product with friends and family." });
    } catch {
      toast({ title: "Couldn't copy link", description: "Please copy the address from your browser." });
    }
  };

  const [product, setProduct] = useState<(Product & { 
    images: string[]; 
    description: string; 
    features: string[]; 
    specifications: Record<string, string>;
  }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (product) setWishlisted(isWishlisted(product.id));
  }, [product?.id]);


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
    setCartCount(readCartCount());
    toast({
      title: "Added to cart",
      description: `${quantity} x ${product.name} added to your cart`,
    });
  };

  const handleBuyNow = () => {
    onAddToCart(product, quantity);
    setCartCount(readCartCount());
    navigate("/?cart=checkout");
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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" aria-label="Go to home page" className="relative p-1.5 bg-gradient-to-br from-background/80 to-background/60 rounded-xl border border-border/30 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300">
              <img src={logo} alt="Shop Logo" className="h-10 w-auto object-contain" />
            </Link>
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Shop
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open cart"
            onClick={() => navigate("/?cart=open")}
            className="relative"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image — zoomable */}
            <div className="relative aspect-square rounded-xl overflow-hidden bg-product-card group/zoom">
              <TransformWrapper
                key={selectedImageIndex}
                initialScale={1}
                minScale={1}
                maxScale={5}
                centerZoomedOut
                wheel={{ step: 0.2 }}
                doubleClick={{ mode: "toggle", step: 2 }}
                onTransform={(_, s) => setZoomScale(s.scale)}
              >
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <>
                    <TransformComponent
                      wrapperClass="!w-full !h-full"
                      contentClass="!w-full !h-full"
                      wrapperStyle={{ width: "100%", height: "100%" }}
                    >
                      <img
                        src={product.images[selectedImageIndex]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        draggable={false}
                      />
                    </TransformComponent>
                    <div className="absolute bottom-3 right-3 flex gap-1.5 opacity-0 group-hover/zoom:opacity-100 focus-within:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded-lg p-1 shadow-sm">
                      <Button variant="ghost" size="icon" aria-label="Zoom out" className="h-8 w-8" onClick={() => zoomOut()}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Zoom in" className="h-8 w-8" onClick={() => zoomIn()}>
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Reset zoom" className="h-8 w-8" onClick={() => resetTransform()}>
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                    {zoomScale > 1.01 && (
                      <div className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm text-xs px-2 py-1 rounded-md">
                        {Math.round(zoomScale * 100)}%
                      </div>
                    )}
                  </>
                )}
              </TransformWrapper>
              <p className="absolute bottom-3 left-3 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md pointer-events-none opacity-100 group-hover/zoom:opacity-0 transition-opacity">
                Scroll to zoom • Double-click to enlarge
              </p>
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
          <div className="space-y-6 min-w-0">
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
                {formatINR(product.price)}
              </span>
              {isOnSale && (
                <span className="text-xl text-muted-foreground line-through">
                  {formatINR(product.originalPrice)}
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

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className="min-w-0 basis-full sm:basis-auto sm:flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  size="lg"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart - {formatINR(product.price * quantity)}
                </Button>
                <Button
                  onClick={handleBuyNow}
                  disabled={!product.inStock}
                  variant="outline"
                  size="lg"
                  className="min-w-0 basis-full sm:basis-auto sm:flex-1 border-primary text-primary hover:bg-primary/10"
                >
                  <Zap className="h-5 w-5 mr-2" />
                  Buy Now
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleToggleWishlist}
                  aria-pressed={wishlisted}
                  aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart className={`h-5 w-5 ${wishlisted ? "fill-primary text-primary" : ""}`} />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleShare}
                  aria-label="Share this product"
                >
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

            {/* Product details fill the space beneath the buying controls. */}
            <div className="space-y-6">
              <section>
                <h2 className="text-lg font-semibold mb-3">Features</h2>
                {product.features.length > 0 ? (
                  <ul className="space-y-2">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 shrink-0 bg-primary rounded-full mt-2" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-muted-foreground">Feature details coming soon.</p>}
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3">Specifications</h2>
                {Object.keys(product.specifications).length > 0 ? (
                  <dl className="divide-y divide-border">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-3 py-2 first:pt-0">
                        <dt className="font-medium">{key}</dt>
                        <dd className="text-muted-foreground text-right break-words">{value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : <p className="text-sm text-muted-foreground">Specifications coming soon.</p>}
              </section>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-8">
          <ProductReviews productId={product.id} productName={product.name} />
        </div>
        <div className="mt-8"><ProductQuestions productId={product.id} /></div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;