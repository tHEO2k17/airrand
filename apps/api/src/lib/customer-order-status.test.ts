import { describe, expect, it } from "vitest";
import {
  assertCustomerSafeOrderStatusPayload,
  toCustomerOrderStatusResponse,
} from "./customer-order-status.js";

describe("toCustomerOrderStatusResponse", () => {
  it("returns only customer-safe fields", () => {
    const createdAt = new Date("2026-01-01T12:00:00.000Z");
    const updatedAt = new Date("2026-01-01T12:05:00.000Z");
    const expiresAt = new Date("2026-01-03T12:00:00.000Z");

    const result = toCustomerOrderStatusResponse(
      {
        id: "order-1",
        reference: "ORD-1001",
        merchantId: "merchant-1",
        status: "ready",
        customerName: "Secret Name",
        customerContact: "secret@example.com",
        notes: "Internal note",
        pickupTokenNonce: "nonce-secret",
        pickupTokenExpiresAt: expiresAt,
        pickedUpAt: null,
        createdAt,
        updatedAt,
      },
      [
        {
          id: "line-1",
          orderId: "order-1",
          productId: "product-1",
          quantity: 2,
          productName: "Espresso",
          unitPriceCents: 350,
          createdAt,
        },
      ],
      {
        id: "merchant-1",
        name: "Demo Cafe",
        slug: "demo-cafe",
        createdAt,
        updatedAt,
      },
    );

    expect(result).toEqual({
      id: "order-1",
      reference: "ORD-1001",
      status: "ready",
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      pickedUpAt: null,
      pickupTokenExpiresAt: expiresAt.toISOString(),
      lines: [{ productName: "Espresso", quantity: 2 }],
      merchant: { id: "merchant-1", name: "Demo Cafe" },
    });

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("Secret Name");
    expect(serialized).not.toContain("secret@example.com");
    expect(serialized).not.toContain("Internal note");
    expect(serialized).not.toContain("nonce-secret");
    expect(serialized).not.toContain("unitPriceCents");
    expect(serialized).not.toContain("productId");

    assertCustomerSafeOrderStatusPayload(
      result as unknown as Record<string, unknown>,
    );
  });
});
