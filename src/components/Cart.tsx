import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Tag } from "lucide-react";
import { Coupon, DEFAULT_SETTINGS, StoreSettings, computeTotals, fetchStoreSettings, formatINR, lookupCoupon } from "@/lib/pricing";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product } from "./ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { PENDING_ORDER_KEY } from "@/lib/orders";
import CheckoutForm, { CheckoutDetails } from "@/components/CheckoutForm";

export interface CartItem extends Product {
  quantity: number;
}

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
}

const Cart = ({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveItem }: CartProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"cart" | "details">("cart");
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [codeInput, setCodeInput] = useState("");
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [checking, setChecking] = useState(false);
  useEffect(() => { if (isOpen) fetchStoreSettings().then(setSettings); else setStep("cart"); }, [isOpen]);
  const { discount, shipping, total, couponOk } = computeTotals(subtotal, settings, coupon);
  const threshold = settings.free_shipping_threshold;

  const applyCoupon = async () => {
    setChecking(true);
    const c = await lookupCoupon(codeInput);
    setChecking(false);
    if (!c) { setCoupon(null); toast({ title: "Invalid code", description: "That coupon doesn't exist or has expired." }); return; }
    setCoupon(c);
    toast({ title: "Coupon applied", description: subtotal < c.min_order ? `Spend ${formatINR(c.min_order)} to use this code.` : c.code });
  };

  const loadRazorpayScript = (): Promise<boolean> =>
    new Promise((resolve) => {
      if ((window as any).Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const FRIENDLY = "Something went wrong on our side. Please wait a moment and try again — your cart and details are saved.";
  const handleCheckout = async (details: CheckoutDetails) => {
    try {
      setIsLoading(true);

      let data: any = null;
      for (let attempt = 0; attempt < 3 && !data?.orderId; attempt++) {
        if (attempt) await new Promise((r) => setTimeout(r, 1200 * attempt));
        try {
          const res = await supabase.functions.invoke("create-razorpay-order", {
            body: {
              product: cartItems.length === 1 ? cartItems[0].name : `${cartItems.length} items`,
              amount: Math.round(total * 100) / 100,
            },
          });
          if (!res.error) data = res.data;
          else console.error("create-razorpay-order failed", res.error);
        } catch (e) { console.error("create-razorpay-order threw", e); }
      }
      if (!data?.orderId) throw new Error(FRIENDLY);

      const scriptOk = await loadRazorpayScript();
      if (!scriptOk) throw new Error("Could not load the payment window. Check your connection and try again.");

      const rzp = new (window as any).Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "Buttabomma Shop",
        description: cartItems.length === 1 ? cartItems[0].name : `${cartItems.length} items`,
        order_id: data.orderId,
        theme: { color: "#16a34a" },
        prefill: { name: details.name, email: details.email, contact: details.phone },
        handler: async (resp: any) => {
          const body = {
            body: {
              action: "create",
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
              items: cartItems.map((i) => ({ id: i.id, quantity: i.quantity })),
              shipping_fee: shipping,
              coupon_code: couponOk ? coupon?.code : null,
              customer: {
                name: details.name,
                email: details.email,
                phone: details.phone,
                address: {
                  address: details.address,
                  city: details.city,
                  state: details.state,
                  zip: details.zip,
                  country: "India",
                  instructions: details.instructions,
                },
              },
          };
          let saved: any = null;
          for (let attempt = 0; attempt < 3 && !saved?.order_number; attempt++) {
            if (attempt) await new Promise((r) => setTimeout(r, 1500 * attempt));
            try {
              const res = await supabase.functions.invoke("orders", { body });
              if (!res.error) saved = res.data; else console.error("orders create failed", res.error);
            } catch (e) { console.error("orders create threw", e); }
          }
          localStorage.removeItem("cart");
          window.dispatchEvent(new Event("cart-changed"));
          if (saved?.order_number) {
            sessionStorage.setItem(PENDING_ORDER_KEY, JSON.stringify({
              order_number: saved.order_number, payment_id: resp.razorpay_payment_id,
            }));
            window.location.href = `/payment-success?shipping_complete=1&order=${saved.order_number}`;
          } else {
            window.location.href = "/payment-success?shipping_complete=1";
          }
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
            toast({ title: "Payment canceled", description: "Your cart is saved — you can check out anytime." });
          },
        },
      });
      rzp.on("payment.failed", (resp: any) => {
        setIsLoading(false);
        console.error("Razorpay payment failed", resp?.error);
        toast({ title: "Payment didn't go through", description: "No money was taken. Please try again or use another payment method." });
      });
      rzp.open();
    } catch (err: any) {
      console.error("Checkout error", err);
      toast({ title: "We couldn't start your payment", description: FRIENDLY });
      setIsLoading(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Cart Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-background shadow-elegant transform transition-transform">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              {step === "details" ? "Delivery Details" : "Shopping Cart"}
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {step === "details" ? (
            <CheckoutForm
              total={formatINR(total)}
              isLoading={isLoading}
              onBack={() => setStep("cart")}
              onSubmit={handleCheckout}
            />
          ) : (
          <>
          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {cartItems.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Your cart is empty</p>
                <Button 
                  onClick={onClose}
                  className="mt-4"
                >
                  Continue Shopping
                </Button>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1 space-y-2">
                    <h3 className="font-medium text-sm">{item.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-price">{formatINR(item.price)}</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive p-0 h-auto"
                      onClick={() => onRemoveItem(item.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {cartItems.length > 0 && (
            <div className="border-t p-6 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatINR(subtotal)}</span>
                </div>
                {couponOk && discount > 0 && (
                  <div className="flex justify-between text-sm text-primary">
                    <span>Discount ({coupon!.code})</span>
                    <span>-{formatINR(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>
                    {shipping === 0 ? (
                      <Badge variant="secondary" className="text-xs">Free</Badge>
                    ) : (
                      formatINR(shipping)
                    )}
                  </span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>{formatINR(total)}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Input placeholder="Coupon code" value={codeInput} maxLength={40}
                  onChange={(e) => setCodeInput(e.target.value)} />
                {coupon ? (
                  <Button variant="outline" onClick={() => { setCoupon(null); setCodeInput(""); }}>Remove</Button>
                ) : (
                  <Button variant="outline" onClick={applyCoupon} disabled={checking || !codeInput.trim()}>
                    <Tag className="h-4 w-4 mr-1" />{checking ? "..." : "Apply"}
                  </Button>
                )}
              </div>
              {coupon && !couponOk && (
                <p className="text-xs text-destructive">Code {coupon.code} needs an order of {formatINR(coupon.min_order)} or more.</p>
              )}

              <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => setStep("details")} disabled={isLoading}>
                Proceed to Checkout
              </Button>
              
              {threshold != null && shipping > 0 && subtotal < threshold && (
                <p className="text-xs text-muted-foreground text-center">
                  Add {formatINR(threshold - subtotal)} more for free shipping!
                </p>
              )}
            </div>
          )}
          </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cart;