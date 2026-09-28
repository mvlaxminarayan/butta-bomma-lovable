import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Order } from "@/lib/orders";
import { OrderTimeline } from "@/components/OrderTimeline";
import { useAuth } from "@/hooks/useAuth";

const TrackOrder = () => {
  const [params] = useSearchParams();
  const { user } = useAuth();
  const [orderNumber, setOrderNumber] = useState(params.get("order") || "");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => { document.title = "Track Your Order - Buttabomma Shop"; }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(""); setOrder(null);
    const { data, error } = await supabase.functions.invoke("orders", {
      body: { action: "track", order_number: orderNumber, email },
    });
    setLoading(false);
    if (error || !data?.order) {
      let msg = "No order found with that number and email.";
      try { const b = await (error as any)?.context?.json(); if (b?.error) msg = b.error; } catch { /* ignore */ }
      setError(msg);
      return;
    }
    setOrder(data.order);
  };

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <Button variant="ghost" size="sm" asChild><Link to="/"><ArrowLeft className="mr-1 h-4 w-4" />Back to Shop</Link></Button>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><PackageSearch className="h-5 w-5 text-primary" />Track your order</CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter the order number from your confirmation and the email you used at checkout.
              {user && <> Signed in? See all your orders in <Link to="/my-orders" className="text-primary underline">My Orders</Link>.</>}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <div className="space-y-1.5">
                <Label htmlFor="order-number">Order number</Label>
                <Input id="order-number" placeholder="BB-XXXXXXX" value={orderNumber} maxLength={20}
                  onChange={(e) => setOrderNumber(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="track-email">Email</Label>
                <Input id="track-email" type="email" value={email} maxLength={255}
                  onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <Button type="submit" disabled={loading}>{loading ? "Checking..." : "Track"}</Button>
            </form>
            {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>

        {order && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order {order.order_number}</CardTitle>
              <p className="text-sm text-muted-foreground">Placed {new Date(order.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}</p>
            </CardHeader>
            <CardContent><OrderTimeline order={order} /></CardContent>
          </Card>
        )}
      </div>
    </main>
  );
};

export default TrackOrder;
