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
import Seo from "@/components/Seo";

const TrackOrder = () => {
  const [params] = useSearchParams();
  const { user } = useAuth();
  const [identifier, setIdentifier] = useState(params.get("order") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);


  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = identifier.trim();
    if (!value) {
      setError("Enter your order number or the email you used at checkout.");
      return;
    }
    setLoading(true); setError(""); setOrders([]);
    const body = value.includes("@")
      ? { action: "track", email: value }
      : { action: "track", order_number: value };
    const { data, error } = await supabase.functions.invoke("orders", { body });
    setLoading(false);
    if (error) {
      setError("We couldn't check your order right now. Please try again in a moment.");
      return;
    }
    const found: Order[] = data?.order ? [data.order] : Array.isArray(data?.orders) ? data.orders : [];
    if (!found.length) {
      setError(data?.error || "No order found. Check your order number or email and try again.");
      return;
    }
    setOrders(found);
  };

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <Seo
        title="Track Your Order"
        description="Check the latest status of your Buttabomma Shop order with your order number and email."
        path="/track-order"
      />
      <div className="mx-auto max-w-2xl space-y-6">
        <Button variant="ghost" size="sm" asChild><Link to="/"><ArrowLeft className="mr-1 h-4 w-4" />Back to Shop</Link></Button>
        <h1 className="text-2xl font-bold tracking-tight">Track Your Order</h1>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><PackageSearch className="h-5 w-5 text-primary" />Find your order</CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter the order number from your confirmation, plus either the email you used at checkout
              or the tracking number from your shipping message.
              {user && <> Signed in? See all your orders in <Link to="/my-orders" className="text-primary underline">My Orders</Link>.</>}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="order-number">Order number</Label>
                <Input id="order-number" placeholder="BB-XXXXXXX" value={orderNumber} maxLength={20}
                  onChange={(e) => setOrderNumber(e.target.value)} required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="track-email">Email <span className="font-normal text-muted-foreground">(any one is enough)</span></Label>
                  <Input id="track-email" type="email" value={email} maxLength={255}
                    onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="track-tracking">or Tracking number</Label>
                  <Input id="track-tracking" value={tracking} maxLength={60}
                    onChange={(e) => setTracking(e.target.value)} placeholder="e.g. AWB / consignment no." />
                </div>
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
