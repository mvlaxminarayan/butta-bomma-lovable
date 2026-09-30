import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Question = { id: string; customer_name: string; question: string; answer: string | null; created_at: string; user_id: string };
const questions = () => (supabase as any).schema("api").from("product_questions");

export default function ProductQuestions({ productId }: { productId: string }) {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<Question[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await questions().select("id,customer_name,question,answer,created_at,user_id").eq("product_id", productId).order("created_at", { ascending: false }).limit(50);
    if (error) toast.error("Could not load product questions");
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { setItems([]); load(); }, [productId, user?.id]);

  const ask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !question.trim()) return;
    setBusy(true);
    const { error } = await questions().insert({
      product_id: productId, user_id: user.id,
      customer_name: (profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Customer").slice(0, 80),
      question: question.trim(),
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setQuestion("");
    toast.success("Question sent to the seller");
    load();
  };

  return (
    <section className="border-t border-border pt-7" aria-labelledby="questions-title">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Ask the maker</p>
        <h2 id="questions-title" className="text-2xl font-semibold mt-1">Questions & answers</h2>
        <p className="text-sm text-muted-foreground mt-1">Curious about this piece? Ask the seller directly.</p>
      </div>
      {user ? (
        <form onSubmit={ask} className="rounded-xl border border-border bg-card p-4 space-y-3 mb-6">
          <label htmlFor="product-question" className="text-sm font-medium">Your question</label>
          <Textarea id="product-question" placeholder="Ask about materials, size, care, or anything else…" value={question} minLength={5} maxLength={1000} required onChange={(e) => setQuestion(e.target.value)} />
          <Button type="submit" disabled={busy || question.trim().length < 5}>{busy ? "Sending…" : "Ask a question"}</Button>
        </form>
      ) : (
        <div className="rounded-xl border border-border bg-card p-4 mb-6 text-sm">Have a question? <Link to="/auth" className="text-primary font-medium underline underline-offset-2">Sign in to ask the seller</Link>.</div>
      )}
      {loading ? <p className="text-sm text-muted-foreground">Loading questions…</p> : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No questions yet. Be the first to ask!</p>
      ) : <div className="divide-y divide-border border-y border-border">
        {items.map((item) => <article key={item.id} className="py-4 space-y-2">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-medium">{item.customer_name}</span>
            <time className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}</time>
            {!item.answer && <span className="text-xs text-muted-foreground">Awaiting seller response</span>}
          </div>
          <p className="text-sm">{item.question}</p>
          {item.answer && <div className="ml-2 border-l-2 border-primary pl-4 py-1 text-sm"><span className="font-semibold text-primary">Seller's answer</span><p className="mt-1 text-muted-foreground whitespace-pre-wrap">{item.answer}</p></div>}
        </article>)}
      </div>}
    </section>
  );
}