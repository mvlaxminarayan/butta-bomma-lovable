import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Counts orders (new or status changed) and questions (new) since the admin
// last opened each tab. "Last seen" times are kept in this browser.
const KEY = (t: string) => `admin_last_seen_${t}`;
const getSeen = (t: string) => {
  const v = localStorage.getItem(KEY(t));
  if (v) return v;
  const now = new Date().toISOString();
  localStorage.setItem(KEY(t), now);
  return now;
};
const markSeen = (t: string) => localStorage.setItem(KEY(t), new Date().toISOString());

const count = async (table: string, column: string, since: string) => {
  const { count } = await (supabase as any).schema("api").from(table)
    .select("id", { count: "exact", head: true }).gt(column, since);
  return count || 0;
};

export function useAdminUnseen(activeTab: string) {
  const [unseen, setUnseen] = useState({ orders: 0, questions: 0 });

  const refresh = useCallback(async () => {
    if (activeTab === "orders") markSeen("orders");
    if (activeTab === "questions") markSeen("questions");
    const [orders, questions] = await Promise.all([
      activeTab === "orders" ? 0 : count("orders", "updated_at", getSeen("orders")),
      activeTab === "questions" ? 0 : count("product_questions", "created_at", getSeen("questions")),
    ]);
    setUnseen({ orders, questions });
  }, [activeTab]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30000);
    return () => {
      clearInterval(id);
      // Leaving a tab counts as having seen everything in it
      if (activeTab === "orders" || activeTab === "questions") markSeen(activeTab);
    };
  }, [refresh, activeTab]);

  return unseen;
}
