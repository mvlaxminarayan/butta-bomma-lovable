import { ShoppingCart, Search, Menu, Heart, User, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useWishlistIds } from "@/hooks/useWishlist";
import logo from "@/assets/logo.png";

interface HeaderProps {
  cartItems: number;
  onCartClick: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

const Header = ({ cartItems, onCartClick, searchQuery = "", onSearchChange }: HeaderProps) => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const wishlistCount = useWishlistIds().length;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" aria-label="Go to home page" className="relative p-2 bg-gradient-to-br from-background/80 to-background/60 rounded-xl border border-border/30 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300">
              <img 
                src={logo} 
                alt="Shop Logo" 
                className="h-12 w-auto object-contain filter brightness-100 contrast-110"
              />
            </Link>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Search handcrafted items..." 
                className="pl-10 border-border focus:ring-primary"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex relative"
              onClick={() => navigate("/?wishlist=1")}
              aria-label="Wishlist"
            >
              <Heart className={`h-5 w-5 ${wishlistCount > 0 ? "fill-primary text-primary" : ""}`} />
              {wishlistCount > 0 && (
                <Badge
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-accent text-accent-foreground text-xs"
                >
                  {wishlistCount}
                </Badge>
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={onCartClick}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItems > 0 && (
                <Badge 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-accent text-accent-foreground text-xs"
                >
                  {cartItems}
                </Badge>
              )}
            </Button>

            <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
              <Link to="/track-order">Track Order</Link>
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <span className="font-medium">{profile?.full_name || user.email}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-orders">My Orders</Link>
                  </DropdownMenuItem>
                  {profile?.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin">Admin Dashboard</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate("/", { state: { scrollTo: "products" } })}>
                  Shop All
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/", { state: { scrollTo: "our-story" } })}>
                  Our Story
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/?wishlist=1")}>
                  Wishlist{wishlistCount > 0 ? ` (${wishlistCount})` : ""}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/track-order")}>
                  Track Order
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Search handcrafted items..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;