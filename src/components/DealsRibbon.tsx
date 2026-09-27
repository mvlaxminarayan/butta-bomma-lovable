import { useEffect, useState } from "react";
import { Truck, Tag, Check, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchStoreSettings } from "@/lib/pricing";
import { useToast } from "@/hooks/use-toast";

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
    .order("created_at", { ascending: false })
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

  const Card = ({ icon, label, title, desc, children }: {
    icon: React.ReactNode;
    label: string;
    title: string;
    desc: string;
    children?: React.ReactNode;
  }) => (
    <div className="bg-card border border-primary/20 shadow-sm p-5 rounded-sm flex items-start gap-4 transition-all hover:border-primary/40">
      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-secondary rounded-full">
        {icon}
      </div>
      <div className="space-y-1 min-w-0">
        <div className="text-[9px] font-bold text-primary tracking-widest uppercase">{label}</div>
        <h3 className="text-base font-medium text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{desc}</p>
        {children}
      </div>
    </div>
  );

  return (
    <section className="bg-background pb-4">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center justify-center gap-4 pt-6 pb-5">
          <div className="h-px flex-1 bg-primary/20" />
          <h2 className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase whitespace-nowrap">
            Current Store Offers
          </h2>
          <div className="h-px flex-1 bg-primary/20" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {threshold != null && (
            <Card
              icon={<Truck className="w-5 h-5 text-primary" />}
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
              <Card
                key={c.code}
                icon={<Tag className="w-5 h-5 text-primary" />}
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
                <div className="pt-2 flex items-center gap-2">
                  <span className="inline-block px-3 py-1 bg-secondary border border-dashed border-primary/30 font-mono font-bold text-foreground rounded text-sm tracking-widest">
                    {c.code}
                  </span>
                  <button
                    type="button"
                    aria-label={`Copy coupon code ${c.code}`}
                    onClick={() => copyCode(c.code)}
                    className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors"
                  >
                    {copied === c.code ? (
                      <><Check className="w-3.5 h-3.5 text-primary" /> Copied</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> Copy</>
                    )}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default DealsRibbon;
