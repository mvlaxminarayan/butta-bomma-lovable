import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Order, STATUS_LABELS } from "@/lib/orders";
import { formatINR } from "@/lib/pricing";
import { OrderTimeline } from "@/components/OrderTimeline";
import { productImageRefs, resolveImageUrls, FALLBACK_IMAGE } from "@/lib/productImages";

const MyOrders = () => {
  const { user, loading: authLoading } = useAuth() as any;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  useEffect(() => { document.title = "My Orders - Buttabomma Shop"; }, []);

  useEffect(() => {
    if (!user) return;
    (supabase as any).schema("api").from("orders").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(async ({ data }: any) => {
        const list: Order[] = data || [];
        setOrders(list);
        setLoading(false);
        const ids = Array.from(new Set(list.flatMap((o) => (o.items || []).map((i) => i.id).filter(Boolean))));
        if (!ids.length) return;
        const { data: prods } = await (supabase as any).schema("api").from("products")
          .select("id, image_url, images").in("id", ids);
        const map: Record<string, string> = {};
        for (const p of prods || []) {
          const [ref] = productImageRefs(p as any);
          if (!ref) continue;
          const [url] = await resolveImageUrls([ref]);
          if (url) map[p.id] = url;
        }
        setThumbs(map);
      });
  }, [user]);

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
        ) : orders.map((o) => (
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
            {open === o.order_number && <CardContent><OrderTimeline order={o} /></CardContent>}
          </Card>
        ))}
      </div>
    </main>
  );
};

export default MyOrders;
