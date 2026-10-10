import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Order, STATUS_LABELS, OrderFilter as Filter, ORDER_FILTERS as FILTERS, matchesOrderFilter as matchesFilter } from "@/lib/orders";
import { formatINR } from "@/lib/pricing";
import { OrderTimeline } from "@/components/OrderTimeline";
import { OrderItemThumbs } from "@/components/OrderItemThumbs";
import { OrderPager, ORDERS_PER_PAGE } from "@/components/OrderPager";
import { Input } from "@/components/ui/input";

const MyOrders = () => {
  const { user, loading: authLoading } = useAuth() as any;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => { document.title = "My Orders - Buttabomma Shop"; }, []);

  useEffect(() => {
    if (!user) return;
    (supabase as any).schema("api").from("orders").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }: any) => {
        const list: Order[] = data || [];
        setOrders(list);
        setLoading(false);
      });
  }, [user]);

  const q = search.trim().toLowerCase();
  const filtered = orders.filter((o) => matchesFilter(o, filter) &&
    (!q || o.order_number.toLowerCase().includes(q) || (o.items || []).some((i) => i.name.toLowerCase().includes(q))));
  const pageCount = Math.max(1, Math.ceil(filtered.length / ORDERS_PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * ORDERS_PER_PAGE, (safePage + 1) * ORDERS_PER_PAGE);

  if (!authLoading && !user) return <Navigate to="/auth" replace />;

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <Button variant="ghost" size="sm" asChild><Link to="/"><ArrowLeft className="mr-1 h-4 w-4" />Back to Shop</Link></Button>
        <h1 className="text-2xl font-semibold">My Orders</h1>
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : orders.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">
            <Package className="mx-auto mb-3 h-10 w-10" />
            No orders yet. Orders placed while signed in appear here.
            <div className="mt-2">Ordered as a guest? <Link to="/track-order" className="text-primary underline">Track it here</Link>.</div>
          </CardContent></Card>
        ) : (<>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <Button key={f.key} size="sm" variant={filter === f.key ? "default" : "outline"}
                  onClick={() => { setFilter(f.key); setPage(0); }}>
                  {f.label} ({orders.filter((o) => matchesFilter(o, f.key)).length})
                </Button>
              ))}
            </div>
            <Input placeholder="Search by order number or product name" value={search} maxLength={100}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
          </div>
          {filtered.length === 0 && (
            <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">No orders match your filter.</CardContent></Card>
          )}
          {visible.map((o) => (
          <Card key={o.order_number}>
            <CardHeader className="cursor-pointer" onClick={() => setOpen(open === o.order_number ? null : o.order_number)}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{o.order_number}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {new Date(o.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })} · {formatINR(o.total)}
                  </p>
                </div>
                <Badge variant={o.status === "cancelled" || o.status === "refunded" ? "destructive" : "secondary"}>{STATUS_LABELS[o.status]}</Badge>
              </div>
            </CardHeader>
            <div className="px-6 pb-4"><OrderItemThumbs items={o.items} /></div>
            {open === o.order_number && <CardContent><OrderTimeline order={o} /></CardContent>}
          </Card>
          ))}
          <OrderPager page={safePage} total={filtered.length} onPage={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
        </>)}
      </div>
    </main>
  );
};

export default MyOrders;
