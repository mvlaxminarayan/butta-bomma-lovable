/// <reference types="node" />
import { describe, it as test } from "node:test";
import { strict as assert } from "node:assert";
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
    assert.equal(orderUnreadLabel(order, {}), "Unopened");
    const seen = markOrderOpened({ ...order, id: "order-2" }, {});
    assert.equal(orderUnreadLabel(order, seen), "Unopened");
    assert.equal(orderUnreadLabel(order, markOrderOpened(order, seen)), null);
  });
  test("a status change highlights an opened order again", () => {
    const seen = markOrderOpened(order, {});
    const updated: Order = { ...order, status: "shipped" };
    assert.equal(orderUnreadLabel(updated, seen), "Updated");
    assert.equal(orderUnreadLabel(updated, markOrderOpened(updated, seen)), null);
  });
  test("read state survives reload and stays scoped to the admin", () => {
    const saved = markOrderOpened(order, {});
    const storage = { getItem: (key: string) => key === orderReadKey("admin-1") ? JSON.stringify(saved) : null };
    assert.equal(orderUnreadLabel(order, loadOrderReadState(storage, "admin-1")), null);
    assert.equal(orderUnreadLabel(order, loadOrderReadState(storage, "admin-2")), "Unopened");
  });
});