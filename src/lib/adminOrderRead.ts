import type { Order } from "./orders";

export type OrderReadState = Record<string, string>;

export const orderReadKey = (adminId: string) => `admin_order_read_${adminId}`;
export const orderIdentity = (order: Order) => order.id || order.order_number;
export const orderRevision = (order: Order) => JSON.stringify([
  order.updated_at || order.created_at,
  order.status,
  order.status_history,
  order.courier,
  order.tracking_number,
]);

export function orderUnreadLabel(order: Order, seen: OrderReadState): "Unopened" | "Updated" | null {
  const previous = seen[orderIdentity(order)];
  if (!previous) return "Unopened";
  return previous === orderRevision(order) ? null : "Updated";
}

export function markOrderOpened(order: Order, seen: OrderReadState): OrderReadState {
  return { ...seen, [orderIdentity(order)]: orderRevision(order) };
}

export function loadOrderReadState(storage: Pick<Storage, "getItem">, adminId: string): OrderReadState {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(orderReadKey(adminId)) || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([, value]) => typeof value === "string"));
  } catch {
    return {};
  }
}