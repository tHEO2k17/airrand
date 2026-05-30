import { describe, expect, it } from "vitest";
import { toCustomerOrderStatusResponse } from "./customer-order-status.js";
import { toOrderResponse } from "./mappers.js";

describe("order mappers", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");

  it("exposes reference on merchant order responses", () => {
    const mapped = toOrderResponse(
      {
        id: "11111111-1111-1111-1111-111111111111",
        reference: "ORD-1001",
        merchantId: "22222222-2222-2222-2222-222222222222",
        status: "placed",
        customerName: "Guest",
        customerContact: null,
        notes: null,
        pickupTokenNonce: "secret",
        pickupTokenExpiresAt: null,
        pickedUpAt: null,
        createdAt: now,
        updatedAt: now,
      },
      [],
    );

    expect(mapped.reference).toBe("ORD-1001");
    expect(mapped.id).toBe("11111111-1111-1111-1111-111111111111");
  });

  it("exposes reference on customer order status responses", () => {
    const mapped = toCustomerOrderStatusResponse(
      {
        id: "11111111-1111-1111-1111-111111111111",
        reference: "ORD-1002",
        merchantId: "22222222-2222-2222-2222-222222222222",
        status: "accepted",
        customerName: "Guest",
        customerContact: null,
        notes: null,
        pickupTokenNonce: "secret",
        pickupTokenExpiresAt: null,
        pickedUpAt: null,
        createdAt: now,
        updatedAt: now,
      },
      [],
      {
        id: "22222222-2222-2222-2222-222222222222",
        name: "Demo Cafe",
        slug: "demo-cafe",
        createdAt: now,
        updatedAt: now,
      },
    );

    expect(mapped.reference).toBe("ORD-1002");
    expect(JSON.stringify(mapped)).not.toContain("secret");
  });
});
