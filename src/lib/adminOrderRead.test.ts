import { describe, expect, test } from "bun:test";
import type { Order } from "./orders";
import { loadOrderReadState, markOrderOpened, orderReadKey, orderUnreadLabel } from "./adminOrderRead";

const order: Order = {
  id: "order-1", order_number: "BB-12345", status: "paid", items: [],
  subtotal: 100, shipping_fee: 0, discount: 0, total: 100,
  courier: null, tracking_number: null, status_history: [],
  customer_name: "Customer", shipping_address: {}, created_at: "2026-10-08T18:00:00Z",
};

describe("individual admin order read state", () => {
  test("unopened orders stay unread until that specific order is opened", () => {
    expect(orderUnreadLabel(order, {})).toBe("Unopened");
    const seen = markOrderOpened({ ...order, id: "order-2" }, {});
    expect(orderUnreadLabel(order, seen)).toBe("Unopened");
    expect(orderUnreadLabel(order, markOrderOpened(order, seen))).toBeNull();
  });
  test("a status change highlights an opened order again", () => {
    const seen = markOrderOpened(order, {});
    const updated: Order = { ...order, status: "shipped" };
    expect(orderUnreadLabel(updated, seen)).toBe("Updated");
    expect(orderUnreadLabel(updated, markOrderOpened(updated, seen))).toBeNull();
  });
  test("read state survives reload and stays scoped to the admin", () => {
    const saved = markOrderOpened(order, {});
    const storage = { getItem: (key: string) => key === orderReadKey("admin-1") ? JSON.stringify(saved) : null };
    expect(orderUnreadLabel(order, loadOrderReadState(storage, "admin-1"))).toBeNull();
    expect(orderUnreadLabel(order, loadOrderReadState(storage, "admin-2"))).toBe("Unopened");
  });
});