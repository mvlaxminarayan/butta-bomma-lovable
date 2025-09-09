import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import ProductCard, { Product } from "./ProductCard";
import productMug from "@/assets/product-mug.jpg";
import productBasket from "@/assets/product-basket.jpg";
import productCuttingBoard from "@/assets/product-cutting-board.jpg";
import { getProductReviewsSync } from "@/hooks/useProductReviews";

interface ProductGridProps {
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

// Fallback product data for when database is empty
const fallbackProducts = [
  {
    id: "fallback-1",
    name: "Handcrafted Ceramic Mug",
    price: 28,
    originalPrice: 35,
    image: productMug,
    category: "Ceramics",
    inStock: true,
  },
  {
    id: "fallback-2",
    name: "Woven Storage Basket",
    price: 45,
    image: productBasket,
    category: "Home Decor",
    inStock: true,
  },
  {
    id: "fallback-3",
    name: "Live Edge Cutting Board",
    price: 68,
    originalPrice: 85,
    image: productCuttingBoard,
    category: "Kitchen",
    inStock: true,
  },
];

// Get products with review data from database or fallback
const getProductsWithReviews = async (): Promise<Product[]> => {
  try {
    console.log("Fetching products from database...");
    
    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .eq("in_stock", true)
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

    console.log("Successfully fetched products, mapping data...");
    
    // Map database products to Product interface
    return products.map(product => {
      const { averageRating, reviewCount } = getProductReviewsSync(product.id);
      
      // Map database image names to imported assets
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
      
      return {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        image: productImage,
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

const ProductGrid = ({ onAddToCart, onViewDetails }: ProductGridProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const productsWithReviews = await getProductsWithReviews();
      setProducts(productsWithReviews);
      setLoading(false);
    };

    fetchProducts();
  }, []);

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
  
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Featured <span className="text-primary">Collection</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Carefully curated handmade items that bring warmth and character to your home
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>

        <div className="text-center mt-12">
          <button className="text-primary font-semibold hover:underline transition-all duration-300">
            View All Products →
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProductGrid;