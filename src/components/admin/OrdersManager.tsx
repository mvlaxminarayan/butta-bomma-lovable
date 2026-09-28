import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { ALL_STATUSES, Order, OrderStatus, STATUS_LABELS } from "@/lib/orders";
import { formatINR } from "@/lib/pricing";
import { RefreshCw } from "lucide-react";

const db = () => (supabase as any).schema("api").from("orders");

const OrderRow = ({ order, onSaved }: { order: Order; onSaved: () => void }) => {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [courier, setCourier] = useState(order.courier || "");
  const [tracking, setTracking] = useState(order.tracking_number || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await db().update({
      status, courier: courier.trim() || null, tracking_number: tracking.trim() || null,
    }).eq("id", order.id);
    setSaving(false);
    if (error) { toast({ title: "Could not update order", description: error.message }); return; }
    toast({ title: "Order updated", description: `${order.order_number}: ${STATUS_LABELS[status]}` });
    onSaved();
  };

  const a = order.shipping_address || {};
  return (
    <div className="rounded-md border">
      <button className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left" onClick={() => setOpen(!open)}>
        <div className="min-w-0">
          <div className="font-medium">{order.order_number} <span className="text-sm font-normal text-muted-foreground">· {order.customer_name || order.email || "Shipping details pending"}</span></div>
          <div className="text-xs text-muted-foreground">
            {new Date(order.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} · {order.items?.reduce((s, i) => s + i.quantity, 0)} item(s) · {formatINR(order.total)}
          </div>
        </div>
        <Badge variant={order.status === "cancelled" || order.status === "refunded" ? "destructive" : order.status === "delivered" ? "default" : "secondary"}>
          {STATUS_LABELS[order.status]}
        </Badge>
      </button>
      {open && (
        <div className="grid gap-4 border-t px-4 py-4 md:grid-cols-2">
          <div className="space-y-2 text-sm">
            <div className="font-medium">Items</div>
            {order.items?.map((i) => <div key={i.id}>{i.name} × {i.quantity} — {formatINR(i.price * i.quantity)}</div>)}
            <div className="pt-2 font-medium">Customer</div>
            <div className="text-muted-foreground">
              {order.customer_name}<br />{order.email}<br />{order.phone}<br />
              {a.address && <>{a.address}, {a.city}, {a.state} {a.zip}, {a.country}<br /></>}
              {a.instructions && <em>Note: {a.instructions}</em>}
            </div>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as OrderStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ALL_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Courier</Label>
              <Input placeholder="e.g. India Post, Delhivery, DTDC" value={courier} maxLength={60} onChange={(e) => setCourier(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Tracking number</Label>
              <Input value={tracking} maxLength={60} onChange={(e) => setTracking(e.target.value)} />
            </div>
            <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
          </div>
        </div>
      )}
    </div>
  );
};

const PAGE_SIZE = 25;
const CLOSED = ["delivered", "cancelled", "refunded"];

const OrdersManager = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "open" | OrderStatus>("open");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  // Debounce search so we don't query on every keystroke
  useEffect(() => {
    const t = setTimeout(() => { setQuery(search.trim()); setPage(0); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadCounts = async () => {
    const { data } = await (supabase as any).schema("api").rpc("order_status_counts");
    const c: Record<string, number> = { all: 0, open: 0 };
    (data || []).forEach((r: { status: string; n: number }) => {
      const n = Number(r.n);
      c[r.status] = n; c.all += n;
      if (!CLOSED.includes(r.status)) c.open += n;
    });
    setCounts(c);
  };

  const load = async () => {
    setLoading(true);
    let q = db().select("*", { count: "exact" }).order("created_at", { ascending: false });
    if (filter === "open") q = q.not("status", "in", `(${CLOSED.join(",")})`);
    else if (filter !== "all") q = q.eq("status", filter);
    if (query) {
      const s = query.replace(/[%,()*]/g, " ");
      q = q.or(`order_number.ilike.%${s}%,customer_name.ilike.%${s}%,email.ilike.%${s}%`);
    }
    const from = page * PAGE_SIZE;
    const { data, error, count } = await q.range(from, from + PAGE_SIZE - 1);
    if (error) toast({ title: "Could not load orders", description: error.message });
    setOrders(data || []);
    setTotal(count || 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter, query, page]);
  useEffect(() => { loadCounts(); }, []);

  const refresh = () => { load(); loadCounts(); };
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const tabs: ("open" | "all" | OrderStatus)[] = ["open", "paid", "packed", "shipped", "out_for_delivery", "delivered", "cancelled", "refunded", "all"];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Orders</CardTitle>
        <Button variant="outline" size="sm" onClick={refresh}><RefreshCw className="mr-1 h-4 w-4" />Refresh</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <Button key={t} size="sm" variant={filter === t ? "default" : "outline"} onClick={() => { setFilter(t); setPage(0); }}>
              {t === "open" ? "To do" : t === "all" ? "All" : STATUS_LABELS[t]} ({counts[t] || 0})
            </Button>
          ))}
        </div>
        <Input placeholder="Search order number, name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
        {loading ? <p className="text-sm text-muted-foreground">Loading orders...</p>
          : orders.length === 0 ? <p className="text-sm text-muted-foreground">No orders here.</p>
          : <div className="space-y-2">{orders.map((o) => <OrderRow key={o.id + o.status} order={o} onSaved={refresh} />)}</div>}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total === 0 ? "0 orders" : `Showing ${page * PAGE_SIZE + 1}–${Math.min(total, (page + 1) * PAGE_SIZE)} of ${total}`}</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={page === 0 || loading} onClick={() => setPage(page - 1)}>Previous</Button>
            <span>Page {page + 1} of {pages}</span>
            <Button size="sm" variant="outline" disabled={page + 1 >= pages || loading} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrdersManager;
