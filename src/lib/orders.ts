export type OrderStatus = "paid" | "packed" | "shipped" | "out_for_delivery" | "delivered" | "cancelled" | "refunded";

export interface OrderItem { id: string; name: string; price: number; quantity: number }

export interface Order {
  id?: string;
  order_number: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  shipping_fee: number;
  discount: number;
  total: number;
  courier: string | null;
  tracking_number: string | null;
  status_history: { status: OrderStatus; at: string }[];
  customer_name: string | null;
  email?: string | null;
  phone?: string | null;
  shipping_address: { address?: string; city?: string; state?: string; zip?: string; country?: string; instructions?: string };
  created_at: string;
  updated_at?: string;
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  paid: "Order placed",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export const PROGRESS_STEPS: OrderStatus[] = ["paid", "packed", "shipped", "out_for_delivery", "delivered"];
export const ALL_STATUSES: OrderStatus[] = [...PROGRESS_STEPS, "cancelled", "refunded"];

export const PENDING_ORDER_KEY = "pending_order";

export type OrderFilter = "all" | "active" | "delivered" | "closed";
export const ORDER_FILTERS: { key: OrderFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "In progress" },
  { key: "delivered", label: "Delivered" },
  { key: "closed", label: "Cancelled / Refunded" },
];
export const matchesOrderFilter = (o: Order, f: OrderFilter) =>
  f === "all" ? true
  : f === "delivered" ? o.status === "delivered"
  : f === "closed" ? o.status === "cancelled" || o.status === "refunded"
  : !["delivered", "cancelled", "refunded"].includes(o.status);
