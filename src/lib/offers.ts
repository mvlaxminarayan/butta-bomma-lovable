import { supabase } from "@/integrations/supabase/client";

export interface ActiveCoupon {
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

export const couponMessage = (c: ActiveCoupon): string => {
  const min = c.min_order > 0 ? ` on orders over $${Number(c.min_order).toFixed(2)}` : "";
  switch (c.discount_type) {
    case "percent":
      return `${Number(c.discount_value)}% off${min}`;
    case "fixed":
      return `$${Number(c.discount_value).toFixed(2)} off${min}`;
    case "free_shipping":
      return `Free shipping${min}`;
  }
};
