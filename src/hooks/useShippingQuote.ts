import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
export interface ShippingQuote {
  subtotal: number; discount: number; shipping: number; total: number;
  source: "live" | "fallback" | "free"; courier: string | null;
  quote_token: string; expires: number;
}
export function useShippingQuote(open: boolean, items: { id: string; quantity: number }[], pincode: string, coupon: string | null) {
  const key = JSON.stringify({ items: items.map(i => ({ id: i.id, quantity: i.quantity })), pincode, coupon_code: coupon });
  const [result, setResult] = useState<{ key: string; quote?: ShippingQuote; error?: string } | null>(null);
  const [refresh, setRefresh] = useState(0);
  const valid = /^[1-9]\d{5}$/.test(pincode) && items.length > 0;
  useEffect(() => {
    if (!open || !valid) { setResult(null); return; }
    let cancelled = false;
    let refreshTimer: ReturnType<typeof setTimeout>;
    setResult(null);
    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase.functions.invoke("shipping-rates", { body: JSON.parse(key) });
        if (cancelled) return;
        if (error || !data?.quote_token) throw new Error(data?.error || "Shipping could not be checked. Please try again.");
        setResult({ key, quote: data });
        refreshTimer = setTimeout(() => setRefresh(n => n + 1), Math.max(1000, data.expires - Date.now() - 30000));
      } catch (error) {
        if (!cancelled) setResult({ key, error: error instanceof Error ? error.message : "Could not calculate shipping." });
      }
    }, 450);
    return () => { cancelled = true; clearTimeout(timer); clearTimeout(refreshTimer); };
  }, [open, valid, key, refresh]);
  const current = result?.key === key ? result : null;
  return { quote: current?.quote, error: current?.error, loading: open && valid && !current, retry: () => setRefresh(n => n + 1) };
}