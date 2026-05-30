import { describe, expect, it } from "vitest";
import type { OrderResponse } from "@airrand/contracts";
import {
  countOrdersByStatus,
  filterOrdersByStatus,
} from "./orders-status-filter.js";

function order(status: OrderResponse["status"], id: string): OrderResponse {
  return {
    id,
    merchantId: "m1",
    reference: `ORD-${id}`,
    status,
    customerName: null,
    customerContact: "+1234567890",
    notes: null,
    lines: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    pickedUpAt: null,
  };
}

describe("filterOrdersByStatus", () => {
  const orders = [
    order("placed", "1"),
    order("ready", "2"),
    order("picked_up", "3"),
  ];

  it("returns all orders when filter is all", () => {
    expect(filterOrdersByStatus(orders, "all")).toHaveLength(3);
  });

  it("filters by status", () => {
    expect(filterOrdersByStatus(orders, "ready").map((o) => o.id)).toEqual(["2"]);
  });
});

describe("countOrdersByStatus", () => {
  it("counts orders per status", () => {
    const counts = countOrdersByStatus([
      order("placed", "1"),
      order("placed", "2"),
      order("ready", "3"),
    ]);
    expect(counts.placed).toBe(2);
    expect(counts.ready).toBe(1);
    expect(counts.accepted).toBe(0);
  });
});
