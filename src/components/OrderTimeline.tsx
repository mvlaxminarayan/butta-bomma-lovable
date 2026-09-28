import { Check, Truck } from "lucide-react";
import { Order, PROGRESS_STEPS, STATUS_LABELS } from "@/lib/orders";
import { formatINR } from "@/lib/pricing";

const fmtDate = (s: string) =>
  new Date(s).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export const OrderTimeline = ({ order }: { order: Order }) => {
  const stopped = order.status === "cancelled" || order.status === "refunded";
  const current = PROGRESS_STEPS.indexOf(order.status);
  const when = (s: string) => order.status_history?.find((h) => h.status === s)?.at;

  return (
    <div className="space-y-5">
      {stopped ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          This order was {STATUS_LABELS[order.status].toLowerCase()}.
        </div>
      ) : (
        <ol className="grid grid-cols-5 gap-1">
          {PROGRESS_STEPS.map((s, i) => {
            const done = i <= current;
            const at = when(s);
            return (
              <li key={s} className="flex flex-col items-center text-center">
                <div className="flex w-full items-center">
                  <div className={`h-0.5 flex-1 ${i === 0 ? "invisible" : done ? "bg-primary" : "bg-border"}`} />
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`}>
                    {done ? <Check className="h-4 w-4" /> : <span className="text-xs">{i + 1}</span>}
                  </div>
                  <div className={`h-0.5 flex-1 ${i === PROGRESS_STEPS.length - 1 ? "invisible" : i < current ? "bg-primary" : "bg-border"}`} />
                </div>
                <span className={`mt-2 text-xs font-medium ${done ? "text-foreground" : "text-muted-foreground"}`}>{STATUS_LABELS[s]}</span>
                {at && <span className="text-[10px] text-muted-foreground">{fmtDate(at)}</span>}
              </li>
            );
          })}
        </ol>
      )}

      {(order.courier || order.tracking_number) && (
        <div className="flex items-start gap-3 rounded-md border bg-muted/40 px-4 py-3 text-sm">
          <Truck className="mt-0.5 h-4 w-4 text-primary" />
          <div>
            <div className="font-medium">{order.courier || "Courier"}</div>
            {order.tracking_number && <div className="text-muted-foreground">Tracking number: <span className="font-mono text-foreground">{order.tracking_number}</span></div>}
          </div>
        </div>
      )}

      <div className="divide-y rounded-md border text-sm">
        {order.items?.map((it) => (
          <div key={it.id} className="flex justify-between px-4 py-2">
            <span>{it.name} × {it.quantity}</span>
            <span>{formatINR(it.price * it.quantity)}</span>
          </div>
        ))}
        {order.discount > 0 && (
          <div className="flex justify-between px-4 py-2 text-primary"><span>Discount</span><span>-{formatINR(order.discount)}</span></div>
        )}
        <div className="flex justify-between px-4 py-2"><span>Shipping</span><span>{order.shipping_fee > 0 ? formatINR(order.shipping_fee) : "Free"}</span></div>
        <div className="flex justify-between px-4 py-2 font-semibold"><span>Total paid</span><span>{formatINR(order.total)}</span></div>
      </div>

      {order.shipping_address?.address && (
        <div className="text-sm text-muted-foreground">
          <div className="font-medium text-foreground">Shipping to</div>
          {order.customer_name}<br />
          {order.shipping_address.address}, {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}
        </div>
      )}
    </div>
  );
};
