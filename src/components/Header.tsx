import { ShoppingCart, Search, Menu, Heart, User, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useWishlistIds } from "@/hooks/useWishlist";
import { BrandLogo } from "@/components/BrandLogo";
import { useLayoutChoice } from "@/lib/layoutPreview";

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
  const { header: layout } = useLayoutChoice();
  const centered = layout === "centered";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-y-2 sm:flex-nowrap">
          {/* Logo */}
          <Link to="/" aria-label="Go to home page" className={`flex items-center gap-3 group mx-auto sm:mx-0 ${centered ? "sm:order-2 sm:mx-auto" : ""}`}>
            <BrandLogo size="lg" />
          </Link>


          {/* Search Bar */}
          <div className={`hidden md:flex flex-1 ${centered ? "order-1 max-w-[240px] mr-6" : "max-w-md mx-8"}`}>
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
          <div className={`flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto lg:gap-4 ${centered ? "sm:order-3 md:flex-1 md:max-w-[240px] md:ml-6" : ""}`}>
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
              aria-label="Open cart"
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
                  <Button variant="ghost" size="icon" aria-label="Account menu">
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
      {layout === "twoTier" && (
        <nav aria-label="Quick links" className="hidden md:block border-t border-border/50">
          <ul className="container mx-auto flex items-center justify-center gap-8 px-4 py-2 text-sm font-medium">
            {[["All Crafts","products"],["Our Story","our-story"]].map(([l,id]) => (
              <li key={l}><button className="hover:text-primary" onClick={() => navigate("/", { state: { scrollTo: id } })}>{l}</button></li>
            ))}
            {["Kondapalli Toys","Wooden Crafts","Home Decor"].map((c) => (
              <li key={c}><button className="hover:text-primary" onClick={() => { onSearchChange?.(c); navigate("/", { state: { scrollTo: "products" } }); }}>{c}</button></li>
            ))}
            <li><Link to="/track-order" className="hover:text-primary">Track Order</Link></li>
          </ul>
        </nav>
      )}
    </header>
  );
};

export default Header;