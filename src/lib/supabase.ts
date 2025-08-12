import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = (window as any).__SUPABASE_URL__;
    const anon = (window as any).__SUPABASE_ANON_KEY__;
    if (!url || !anon) {
      console.error("Supabase URL or Anon Key not found. Ensure Supabase integration is connected.");
    }
    client = createClient(url, anon);
  }
  return client;
}
