import ProductCard, { Product } from "./ProductCard";
import productMug from "@/assets/product-mug.jpg";
import productBasket from "@/assets/product-basket.jpg";
import productCuttingBoard from "@/assets/product-cutting-board.jpg";

interface ProductGridProps {
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

// Mock product data
const products: Product[] = [
  {
    id: "1",
    name: "Handcrafted Ceramic Mug",
    price: 28,
    originalPrice: 35,
    image: productMug,
    rating: 4.8,
    reviews: 42,
    category: "Ceramics",
    inStock: true,
  },
  {
    id: "2",
    name: "Woven Storage Basket",
    price: 45,
    image: productBasket,
    rating: 4.6,
    reviews: 28,
    category: "Home Decor",
    inStock: true,
  },
  {
    id: "3",
    name: "Live Edge Cutting Board",
    price: 68,
    originalPrice: 85,
    image: productCuttingBoard,
    rating: 4.9,
    reviews: 67,
    category: "Kitchen",
    inStock: true,
  },
  {
    id: "4",
    name: "Artisan Ceramic Bowl Set",
    price: 95,
    image: productMug,
    rating: 4.7,
    reviews: 35,
    category: "Ceramics",
    inStock: false,
  },
  {
    id: "5",
    name: "Handwoven Placemat Set",
    price: 32,
    image: productBasket,
    rating: 4.5,
    reviews: 23,
    category: "Home Decor",
    inStock: true,
  },
  {
    id: "6",
    name: "Rustic Serving Tray",
    price: 55,
    image: productCuttingBoard,
    rating: 4.8,
    reviews: 51,
    category: "Kitchen",
    inStock: true,
  },
];

const ProductGrid = ({ onAddToCart, onViewDetails }: ProductGridProps) => {
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