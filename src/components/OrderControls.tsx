import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ORDER_FILTERS, OrderFilter, matchesOrderFilter, Order } from "@/lib/orders";

interface OrderControlsProps {
  orders: Order[];
  filter: OrderFilter;
  onFilterChange: (f: OrderFilter) => void;
  search: string;
  onSearchChange: (v: string) => void;
}

const OrderControls = ({ orders, filter, onFilterChange, search, onSearchChange }: OrderControlsProps) => {
  const q = search.trim().toLowerCase();
  const matched = orders.filter((o) =>
    !q || o.order_number.toLowerCase().includes(q) || (o.items || []).some((i) => i.name.toLowerCase().includes(q)));

  return (
    <section aria-label="Filter and search orders" className="rounded-xl border bg-card p-4 shadow-sm space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          aria-label="Search orders"
          className="h-11 pl-9 text-base"
          placeholder="Search by order number or product name…"
          value={search}
          maxLength={100}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Show</p>
        <div className="flex flex-wrap gap-2">
          {ORDER_FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <Button key={f.key} size="sm" variant={active ? "default" : "outline"}
                className={`rounded-full font-medium ${active ? "" : "border-border/80 text-foreground/80"}`}
                aria-pressed={active}
                onClick={() => onFilterChange(f.key)}>
                {f.label}
                <span className={`ml-1 rounded-full px-1.5 text-xs ${active ? "bg-primary-foreground/20" : "bg-muted"}`}>
                  {matched.filter((o) => matchesOrderFilter(o, f.key)).length}
                </span>
              </Button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default OrderControls;
