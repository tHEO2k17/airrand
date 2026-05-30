import { describe, expect, it } from "vitest";
import { computePosDashboardStats } from "./pos-stats.js";

describe("computePosDashboardStats", () => {
  it("counts active, ready, and catalog value", () => {
    const now = new Date().toISOString();
    const stats = computePosDashboardStats([
      {
        id: "1",
        merchantId: "m",
        status: "ready",
        customerName: "A",
        customerContact: null,
        notes: null,
        lines: [
          {
            id: "l1",
            productId: "p",
            quantity: 2,
            productName: "Coffee",
            unitPriceCents: 500,
          },
        ],
        createdAt: now,
        updatedAt: now,
        pickedUpAt: null,
      },
      {
        id: "2",
        merchantId: "m",
        status: "placed",
        customerName: "B",
        customerContact: null,
        notes: null,
        lines: [
          {
            id: "l2",
            productId: "p",
            quantity: 1,
            productName: "Tea",
            unitPriceCents: 300,
          },
        ],
        createdAt: now,
        updatedAt: now,
        pickedUpAt: null,
      },
      {
        id: "3",
        merchantId: "m",
        status: "picked_up",
        customerName: "C",
        customerContact: null,
        notes: null,
        lines: [],
        createdAt: now,
        updatedAt: now,
        pickedUpAt: now,
      },
    ]);

    expect(stats.activeOrders).toBe(2);
    expect(stats.readyForPickup).toBe(1);
    expect(stats.todaysOrders).toBe(3);
    expect(stats.activeCatalogValueCents).toBe(1300);
  });
});
