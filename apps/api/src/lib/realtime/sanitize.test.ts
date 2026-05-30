import { describe, expect, it } from "vitest";
import {
  assertCustomerSafeRealtimePayload,
  sanitizeRealtimePayload,
} from "./sanitize.js";
import { toCustomerOrderStatusResponse } from "../customer-order-status.js";

describe("sanitizeRealtimePayload", () => {
  it("removes sensitive keys from nested payloads", () => {
    const sanitized = sanitizeRealtimePayload({
      status: {
        id: "order-1",
        pickupTokenNonce: "secret-nonce",
        password_hash: "hash",
        token: "jwt",
      },
    }) as { status: Record<string, unknown> };

    expect(sanitized.status.pickupTokenNonce).toBeUndefined();
    expect(sanitized.status.password_hash).toBeUndefined();
    expect(sanitized.status.token).toBeUndefined();
    expect(sanitized.status.id).toBe("order-1");
  });
});

describe("customer realtime payload", () => {
  it("keeps customer order status safe for public stream", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const status = toCustomerOrderStatusResponse(
      {
        id: "11111111-1111-1111-1111-111111111111",
        reference: "ORD-1001",
        merchantId: "22222222-2222-2222-2222-222222222222",
        status: "placed",
        customerName: "Guest",
        customerContact: "555",
        notes: "no onions",
        pickupTokenNonce: "nonce-secret",
        pickupTokenExpiresAt: now,
        pickedUpAt: null,
        createdAt: now,
        updatedAt: now,
      },
      [
        {
          id: "33333333-3333-3333-3333-333333333333",
          orderId: "11111111-1111-1111-1111-111111111111",
          productId: "44444444-4444-4444-4444-444444444444",
          quantity: 1,
          productName: "Latte",
          unitPriceCents: 500,
          createdAt: now,
        },
      ],
      {
        id: "22222222-2222-2222-2222-222222222222",
        name: "Demo Cafe",
        slug: "demo-cafe",
        description: null,
        createdAt: now,
        updatedAt: now,
      },
    );

    const payload = sanitizeRealtimePayload({ status }) as Record<string, unknown>;
    assertCustomerSafeRealtimePayload(payload);
    expect(JSON.stringify(payload)).not.toContain("nonce-secret");
    expect(JSON.stringify(payload)).not.toContain("no onions");
  });
});
