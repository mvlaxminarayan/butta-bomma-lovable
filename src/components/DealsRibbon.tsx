import { useEffect, useState } from "react";
import { Truck, Tag, Check, Copy, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchStoreSettings } from "@/lib/pricing";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface ActiveCoupon {
  code: string;
  discount_type: "percent" | "fixed" | "free_shipping";
  discount_value: number;
  min_order: number;
  expires_at: string | null;
}

const api = () => (supabase as any).schema("api");

export const fetchActiveCoupons = async (): Promise<ActiveCoupon[]> => {
  const { data, error } = await api()
    .from("active_coupons")
    .select("code, discount_type, discount_value, min_order, expires_at")
    .limit(4);
  if (error) return [];
  return (data ?? []) as ActiveCoupon[];
};

const discountLabel = (c: ActiveCoupon) => {
  const min = c.min_order > 0 ? ` on orders over $${Number(c.min_order).toFixed(2)}` : "";
  switch (c.discount_type) {
    case "percent":
      return { title: `${Number(c.discount_value)}% Off`, desc: min };
    case "fixed":
      return { title: `$${Number(c.discount_value).toFixed(2)} Off`, desc: min };
    case "free_shipping":
      return { title: "Free Shipping", desc: min || " on any order" };
  }
};

const DealsRibbon = () => {
  const { toast } = useToast();
  const [threshold, setThreshold] = useState<number | null>(null);
  const [coupons, setCoupons] = useState<ActiveCoupon[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  // Hover-capable devices unfold on hover; touch devices unfold on tap.
  const canHover = typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;

  useEffect(() => {
    let cancelled = false;
    fetchStoreSettings()
      .then((s) => { if (!cancelled) setThreshold(s.free_shipping_threshold); })
      .catch(() => {});
    fetchActiveCoupons()
      .then((rows) => { if (!cancelled) setCoupons(rows); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (threshold == null && coupons.length === 0) return null;

  const couponCards = coupons.slice(0, threshold != null ? 3 : 4);
  const offerCount = couponCards.length + (threshold != null ? 1 : 0);
  const expanded = open;

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* clipboard unavailable — the code is still visible */
    }
    setCopied(code);
    toast({ title: "Coupon copied", description: `${code} — enter it in your cart at checkout.` });
    setTimeout(() => setCopied((cur) => (cur === code ? null : cur)), 2000);
  };

  const Item = ({ icon, label, title, desc, children }: {
    icon: React.ReactNode;
    label: string;
    title: string;
    desc: React.ReactNode;
    children?: React.ReactNode;
  }) => (
    <div className="flex gap-3 items-start">
      <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-secondary border border-primary/10 rounded-full">
        {icon}
      </div>
      <div className="space-y-0.5 min-w-0">
        <div className="text-[9px] font-bold text-primary tracking-widest uppercase">{label}</div>
        <h3 className="text-sm font-medium text-foreground leading-snug">{title}</h3>
        <p className="text-xs text-muted-foreground leading-snug">{desc}</p>
        {children}
      </div>
    </div>
  );

  return (
    <section className="bg-background pb-2">
      <div className="container mx-auto px-4 max-w-4xl flex justify-center">
        {/* Parchment fold card — collapsed by default, unfolds on hover or tap */}
        <div
          className="group relative w-full max-w-sm bg-card border border-border shadow-sm transition-shadow duration-500 ease-out hover:shadow-md"
          onMouseEnter={canHover ? () => setOpen(true) : undefined}
          onMouseLeave={canHover ? () => setOpen(false) : undefined}
        >
          {/* Top accent line */}
          <div className="h-1 w-full bg-primary/30" />

          {/* Header — always visible, tappable on mobile */}
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls="store-offers-list"
            onClick={() => setOpen((v) => (canHover ? true : !v))}
            className="w-full flex items-center justify-between px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-b-sm"
          >
            <div className="space-y-1">
              <h2 className="text-base font-medium text-foreground leading-none">
                Current Store Offers
              </h2>
              <p className="text-[10px] uppercase tracking-widest text-primary font-medium">
                {offerCount} Active {offerCount === 1 ? "Saving" : "Savings"}
              </p>
            </div>
            <div className="relative flex items-center justify-center w-8 h-8 flex-shrink-0">
              <div
                className={`absolute inset-0 bg-accent/10 rounded-full transition-transform duration-500 ${expanded ? "scale-100" : "scale-0 group-hover:scale-100"}`}
              />
              <ChevronDown
                className={`w-5 h-5 text-primary transition-transform duration-500 ${expanded ? "rotate-180" : "group-hover:rotate-180"}`}
                aria-hidden
              />
            </div>
          </button>

          {/* Unfolding offers list */}
          <div
            id="store-offers-list"
            className={`overflow-hidden transition-all duration-500 ease-out ${
              expanded
                ? "max-h-[480px] opacity-100"
                : "max-h-0 opacity-0 group-hover:max-h-[480px] group-hover:opacity-100"
            }`}
          >
            <div className="px-5 pb-6 pt-4 space-y-5 border-t border-border/60">
              {threshold != null && (
                <Item
                  icon={<Truck className="w-4.5 h-4.5 text-primary" />}
                  label="Shipping"
                  title="Free Standard Delivery"
                  desc={
                    <>
                      Applied automatically on all orders over{" "}
                      <span className="text-price font-bold">${threshold.toFixed(2)}</span>.
                    </>
                  }
                />
              )}

              {couponCards.map((c) => {
                const info = discountLabel(c);
                return (
                  <Item
                    key={c.code}
                    icon={<Tag className="w-4.5 h-4.5 text-primary" />}
                    label="Coupon"
                    title={`${info.title}${info.desc ? "" : " for you"}`}
                    desc={
                      c.discount_type === "free_shipping" ? (
                        <>Use code at checkout{info.desc}.</>
                      ) : info.desc ? (
                        <>
                          Take <span className="text-price font-bold">{info.title}</span>
                          {info.desc} — enter the code at checkout.
                        </>
                      ) : (
                        <>Use the code below at checkout.</>
                      )
                    }
                  >
                    <div className="pt-1.5 flex items-center gap-2">
                      <span className="inline-block px-3 py-1 bg-secondary border border-dashed border-primary/30 font-mono font-bold text-foreground rounded text-sm tracking-widest">
                        {c.code}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={`Copy coupon code ${c.code}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          copyCode(c.code);
                        }}
                        className="h-7 px-2 text-[10px] font-bold tracking-widest uppercase text-muted-foreground hover:text-primary"
                      >
                        {copied === c.code ? (
                          <><Check className="w-3.5 h-3.5 text-primary" /> Copied</>
                        ) : (
                          <><Copy className="w-3.5 h-3.5" /> Copy</>
                        )}
                      </Button>
                    </div>
                  </Item>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DealsRibbon;
