import { describe, expect, it } from "vitest";
import type { OrderResponse } from "@airrand/contracts";
import {
  collectOrderIds,
  detectNewOrdersOnRefresh,
} from "./new-order-detection.js";

function makeOrder(
  overrides: Partial<OrderResponse> & Pick<OrderResponse, "id" | "createdAt">,
): OrderResponse {
  return {
    reference: "ORD-1001",
    merchantId: "merchant-1",
    status: "placed",
    customerName: null,
    customerContact: "555",
    notes: null,
    lines: [],
    subtotalCents: 0,
    updatedAt: overrides.createdAt,
    ...overrides,
  } as OrderResponse;
}

describe("new order detection", () => {
  it("collects order ids", () => {
    expect(collectOrderIds([makeOrder({ id: "a", createdAt: "2026-01-01T00:00:00.000Z" })])).toEqual(
      new Set(["a"]),
    );
  });

  it("detects only recent orders missing from baseline", () => {
    const now = Date.parse("2026-01-01T12:00:00.000Z");
    const previous = new Set(["old-order"]);
    const orders = [
      makeOrder({
        id: "old-order",
        createdAt: "2026-01-01T11:00:00.000Z",
      }),
      makeOrder({
        id: "fresh-order",
        createdAt: "2026-01-01T11:59:30.000Z",
      }),
      makeOrder({
        id: "stale-order",
        createdAt: "2026-01-01T10:00:00.000Z",
      }),
    ];

    const detected = detectNewOrdersOnRefresh({
      previousIds: previous,
      orders,
      now,
      maxAgeMs: 120_000,
    });

    expect(detected.map((order) => order.id)).toEqual(["fresh-order"]);
  });
});
