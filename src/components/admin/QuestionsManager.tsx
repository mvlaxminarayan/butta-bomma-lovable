import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Link } from "react-router-dom";

type Question = { id: string; product_id: string; customer_name: string; question: string; answer: string | null; created_at: string };
const db = () => (supabase as any).schema("api").from("product_questions");
const PAGE = 20;
export default function QuestionsManager() {
  const [items, setItems] = useState<Question[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<"unanswered" | "all">("unanswered");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    let q = db().select("id,product_id,customer_name,question,answer,created_at", { count: "exact" }).order("created_at", { ascending: false });
    if (filter === "unanswered") q = q.is("answer", null);
    const { data, count, error } = await q.range(page * PAGE, (page + 1) * PAGE - 1);
    setLoading(false);
    if (error) return toast.error("Could not load questions: " + error.message);
    setItems(data || []);
    setTotal(count || 0);
    const ids = [...new Set((data || []).map((r: Question) => r.product_id))];
    if (ids.length) {
      const { data: products } = await (supabase as any).schema("api").from("products").select("id,name").in("id", ids);
      setNames(Object.fromEntries((products || []).map((p: { id: string; name: string }) => [p.id, p.name])));
    }
  };
  useEffect(() => { load(); }, [filter, page]);

  const save = async (item: Question) => {
    const answer = (drafts[item.id] ?? item.answer ?? "").trim();
    if (!answer) return toast.error("Write an answer before saving.");
    setSaving(item.id);
    const { error } = await db().update({ answer, answered_at: new Date().toISOString() }).eq("id", item.id);
    setSaving(null);
    if (error) return toast.error(error.message);
    toast.success("Answer published");
    load();
  };

  return <Card><CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3"><CardTitle>Product questions</CardTitle><Button variant="outline" size="sm" onClick={load}>Refresh</Button></CardHeader>
    <CardContent className="space-y-4">
      <div className="flex gap-2"><Button size="sm" variant={filter === "unanswered" ? "default" : "outline"} onClick={() => { setFilter("unanswered"); setPage(0); }}>Needs answer</Button><Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => { setFilter("all"); setPage(0); }}>All questions</Button></div>
      {loading ? <p className="text-sm text-muted-foreground">Loading questions…</p> : items.length === 0 ? <p className="text-sm text-muted-foreground">No questions here yet.</p> : items.map((item) => <div key={item.id} className="rounded-lg border border-border p-4 space-y-3">
        <div className="text-xs text-muted-foreground"><Link to={`/product/${item.product_id}`} className="font-semibold text-primary hover:underline">{names[item.product_id] || "View product"}</Link> · {item.customer_name} · {new Date(item.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}</div>
        <p className="font-medium">{item.question}</p>
        <Textarea aria-label={`Answer question from ${item.customer_name}`} placeholder="Write a helpful answer for shoppers…" maxLength={3000} value={drafts[item.id] ?? item.answer ?? ""} onChange={(e) => setDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))} />
        <Button size="sm" disabled={saving === item.id} onClick={() => save(item)}>{saving === item.id ? "Saving…" : item.answer ? "Update answer" : "Publish answer"}</Button>
      </div>)}
      <div className="flex items-center justify-between text-sm text-muted-foreground"><span>{total} question{total === 1 ? "" : "s"}</span><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={page === 0 || loading} onClick={() => setPage(page - 1)}>Previous</Button><span>{page + 1} / {Math.max(1, Math.ceil(total / PAGE))}</span><Button variant="outline" size="sm" disabled={loading || (page + 1) * PAGE >= total} onClick={() => setPage(page + 1)}>Next</Button></div></div>
    </CardContent></Card>;
}