import { supabase } from "@/integrations/supabase/client";

export interface StoreSettings {
  shipping_fee: number;
  free_shipping_threshold: number | null;
}

export interface Coupon {
  code: string;
  discount_type: "percent" | "fixed" | "free_shipping";
  discount_value: number;
  min_order: number;
}

export const DEFAULT_SETTINGS: StoreSettings = { shipping_fee: 8.99, free_shipping_threshold: 50 };

const api = () => (supabase as any).schema("api");

export async function fetchStoreSettings(): Promise<StoreSettings> {
  const { data } = await api().from("store_settings").select("*").eq("id", 1).maybeSingle();
  if (!data) return DEFAULT_SETTINGS;
  return {
    shipping_fee: Number(data.shipping_fee),
    free_shipping_threshold: data.free_shipping_threshold == null ? null : Number(data.free_shipping_threshold),
  };
}

export async function lookupCoupon(code: string): Promise<Coupon | null> {
  const clean = code.trim().slice(0, 40);
  if (!clean) return null;
  const { data } = await api().rpc("validate_coupon", { _code: clean });
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return { ...row, discount_value: Number(row.discount_value), min_order: Number(row.min_order) };
}

export function computeTotals(subtotal: number, settings: StoreSettings, coupon: Coupon | null) {
  const couponOk = !!coupon && subtotal >= coupon.min_order;
  let discount = 0;
  if (couponOk && coupon!.discount_type === "percent") discount = subtotal * Math.min(coupon!.discount_value, 100) / 100;
  if (couponOk && coupon!.discount_type === "fixed") discount = Math.min(coupon!.discount_value, subtotal);
  discount = Math.round(discount * 100) / 100;
  const thresholdMet = settings.free_shipping_threshold != null && subtotal >= settings.free_shipping_threshold;
  const couponFreeShip = couponOk && coupon!.discount_type === "free_shipping";
  const shipping = thresholdMet || couponFreeShip ? 0 : settings.shipping_fee;
  const total = Math.max(0, subtotal - discount) + shipping;
  return { discount, shipping, total, couponOk };
}
