import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";

const api = () => (supabase as any).schema("api");

interface CouponRow {
  id: string; code: string; discount_type: string; discount_value: number; min_order: number;
  active: boolean; expires_at: string | null; max_uses: number | null; times_used: number;
}

const empty = { code: "", discount_type: "percent", discount_value: "", min_order: "", expires_at: "", max_uses: "" };

export default function DiscountsManager() {
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [form, setForm] = useState(empty);
  const [fee, setFee] = useState("");
  const [threshold, setThreshold] = useState("");
  const [freeShipOn, setFreeShipOn] = useState(true);

  const load = async () => {
    const { data } = await api().from("coupons").select("*").order("created_at", { ascending: false });
    setCoupons(data || []);
    const { data: s } = await api().from("store_settings").select("*").eq("id", 1).maybeSingle();
    if (s) {
      setFee(String(s.shipping_fee));
      setFreeShipOn(s.free_shipping_threshold != null);
      setThreshold(s.free_shipping_threshold != null ? String(s.free_shipping_threshold) : "50");
    }
  };
  useEffect(() => { load(); }, []);

  const saveShipping = async () => {
    const f = parseFloat(fee), t = parseFloat(threshold);
    if (isNaN(f) || f < 0 || (freeShipOn && (isNaN(t) || t < 0))) return toast.error("Enter valid amounts");
    const { error } = await api().from("store_settings")
      .update({ shipping_fee: f, free_shipping_threshold: freeShipOn ? t : null }).eq("id", 1);
    error ? toast.error(error.message) : toast.success("Shipping settings saved");
  };

  const addCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = form.code.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,40}$/.test(code)) return toast.error("Code: 3-40 letters, numbers, - or _");
    const value = form.discount_type === "free_shipping" ? 0 : parseFloat(form.discount_value);
    if (isNaN(value) || value <= 0 && form.discount_type !== "free_shipping") return toast.error("Enter a discount amount");
    if (form.discount_type === "percent" && value > 100) return toast.error("Percent can't exceed 100");
    const { error } = await api().from("coupons").insert([{
      code, discount_type: form.discount_type, discount_value: value,
      min_order: parseFloat(form.min_order) || 0,
      expires_at: form.expires_at ? new Date(form.expires_at + "T23:59:59").toISOString() : null,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
    }]);
    if (error) return toast.error(error.message.includes("duplicate") ? "That code already exists" : error.message);
    toast.success(`Coupon ${code} created`);
    setForm(empty);
    load();
  };

  const toggle = async (c: CouponRow) => {
    await api().from("coupons").update({ active: !c.active }).eq("id", c.id);
    load();
  };
  const remove = async (c: CouponRow) => {
    if (!confirm(`Delete coupon ${c.code}?`)) return;
    await api().from("coupons").delete().eq("id", c.id);
    load();
  };

  const describe = (c: CouponRow) =>
    c.discount_type === "percent" ? `${Number(c.discount_value)}% off`
    : c.discount_type === "fixed" ? `$${Number(c.discount_value).toFixed(2)} off` : "Free shipping";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Shipping</CardTitle>
          <CardDescription>Standard shipping fee and free shipping for larger orders</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label htmlFor="fee">Shipping fee ($)</Label>
            <Input id="fee" type="number" step="0.01" min="0" value={fee} onChange={(e) => setFee(e.target.value)} className="w-32" />
          </div>
          <div className="flex items-center gap-2 pb-2">
            <Switch id="fs" checked={freeShipOn} onCheckedChange={setFreeShipOn} />
            <Label htmlFor="fs">Free shipping on orders over</Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="th">Amount ($)</Label>
            <Input id="th" type="number" step="0.01" min="0" value={threshold} disabled={!freeShipOn}
              onChange={(e) => setThreshold(e.target.value)} className="w-32" />
          </div>
          <Button onClick={saveShipping}>Save</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coupon codes</CardTitle>
          <CardDescription>Customers enter these in the cart before checkout</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={addCoupon} className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input value={form.code} placeholder="SAVE10" maxLength={40}
                onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.discount_type} onValueChange={(v) => setForm({ ...form, discount_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">% off</SelectItem>
                  <SelectItem value="fixed">$ off</SelectItem>
                  <SelectItem value="free_shipping">Free shipping</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{form.discount_type === "percent" ? "Percent" : "Amount ($)"}</Label>
              <Input type="number" step="0.01" min="0" value={form.discount_value}
                disabled={form.discount_type === "free_shipping"}
                onChange={(e) => setForm({ ...form, discount_value: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Min order ($)</Label>
              <Input type="number" step="0.01" min="0" value={form.min_order} placeholder="0"
                onChange={(e) => setForm({ ...form, min_order: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Expires (optional)</Label>
              <Input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Max uses (optional)</Label>
              <div className="flex gap-2">
                <Input type="number" min="1" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} />
                <Button type="submit" size="icon" aria-label="Add coupon"><Plus className="w-4 h-4" /></Button>
              </div>
            </div>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead><TableHead>Discount</TableHead><TableHead>Min order</TableHead>
                <TableHead>Expires</TableHead><TableHead>Used</TableHead><TableHead>Active</TableHead><TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-muted-foreground">No coupons yet</TableCell></TableRow>
              )}
              {coupons.map((c) => {
                const expired = c.expires_at && new Date(c.expires_at) < new Date();
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-medium">{c.code}</TableCell>
                    <TableCell>{describe(c)}</TableCell>
                    <TableCell>{Number(c.min_order) > 0 ? `$${Number(c.min_order).toFixed(2)}` : "-"}</TableCell>
                    <TableCell>
                      {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "Never"}
                      {expired && <Badge variant="destructive" className="ml-2">Expired</Badge>}
                    </TableCell>
                    <TableCell>{c.times_used}{c.max_uses ? ` / ${c.max_uses}` : ""}</TableCell>
                    <TableCell><Switch checked={c.active} onCheckedChange={() => toggle(c)} /></TableCell>
                    <TableCell>
                      <Button variant="destructive" size="sm" onClick={() => remove(c)}><Trash2 className="w-4 h-4" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
