import { Link, useNavigate } from "react-router-dom";
import { Mail, MessageCircle, Instagram, MapPin, Clock } from "lucide-react";
import logo from "@/assets/logo.png";
import { STORE_INFO, whatsappLink, instagramLink } from "@/lib/storeInfo";

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="mt-12 border-t border-border/60 bg-muted/30">
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <img src={logo} alt={STORE_INFO.name} className="h-12 w-auto object-contain" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              Authentic handcrafted treasures made by traditional artisans, delivered across India.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-sm font-semibold tracking-wide uppercase mb-3">Shop</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <button
                  className="hover:text-primary transition-colors"
                  onClick={() => navigate("/", { state: { scrollTo: "products" } })}
                >
                  Shop Collection
                </button>
              </li>
              <li>
                <button
                  className="hover:text-primary transition-colors"
                  onClick={() => navigate("/", { state: { scrollTo: "our-story" } })}
                >
                  Our Story
                </button>
              </li>
              <li><Link className="hover:text-primary transition-colors" to="/?wishlist=1">Wishlist</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/my-orders">My Orders</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/track-order">Track Order</Link></li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h3 className="text-sm font-semibold tracking-wide uppercase mb-3">Help &amp; Policies</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link className="hover:text-primary transition-colors" to="/contact">Contact Us</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/shipping-policy">Shipping &amp; Delivery</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/refund-policy">Cancellation &amp; Refunds</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/terms">Terms &amp; Conditions</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/privacy">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold tracking-wide uppercase mb-3">Get in Touch</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <Mail className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                <a className="hover:text-primary transition-colors" href={`mailto:${STORE_INFO.email}`}>{STORE_INFO.email}</a>
              </li>
              <li className="flex gap-2">
                <MessageCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                <a className="hover:text-primary transition-colors" href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                  {STORE_INFO.phone} <span className="text-xs">(WhatsApp)</span>
                </a>
              </li>
              <li className="flex gap-2">
                <Instagram className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                <a className="hover:text-primary transition-colors" href={instagramLink()} target="_blank" rel="noopener noreferrer">@{STORE_INFO.instagram}</a>
              </li>
              <li className="flex gap-2">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                <span>{STORE_INFO.addressLines.join(", ")}</span>
              </li>
              <li className="flex gap-2">
                <Clock className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                <span>{STORE_INFO.hours}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Payments */}
        <div className="mt-8 pt-6 border-t border-border/60 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground mr-1">Secure payments by Razorpay</span>
            {["UPI", "RuPay", "Visa", "Mastercard", "Net Banking", "Wallets"].map((m) => (
              <span
                key={m}
                className="rounded border border-border bg-card px-2 py-1 text-xs text-muted-foreground"
              >
                {m}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {STORE_INFO.legalName}. Handmade in India.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
