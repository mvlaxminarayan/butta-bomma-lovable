import { supabase } from "@/integrations/supabase/client";

// Share only overlapping reads; a later visit still fetches current inventory.
let pendingCatalog: Promise<{ data: any[] | null; error: any }> | null = null;
export function fetchCatalog() {
  if (pendingCatalog) return pendingCatalog;
  const request = Promise.resolve((supabase as any).schema("api").from("products")
    .select("*").order("in_stock", { ascending: false }).order("created_at", { ascending: false }));
  pendingCatalog = request;
  void request.finally(() => { if (pendingCatalog === request) pendingCatalog = null; }).catch(() => {});
  return request;
}