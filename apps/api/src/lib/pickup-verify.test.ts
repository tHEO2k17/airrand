import { describe, expect, it } from "vitest";
import type { Order } from "@airrand/database";
import {
  PickupBusinessError,
  assertPickupAllowed,
} from "./pickup-verify.js";

const baseOrder: Order = {
  id: "11111111-1111-4111-8111-111111111111",
  reference: "ORD-1001",
  merchantId: "22222222-2222-4222-8222-222222222222",
  status: "ready",
  customerName: null,
  customerContact: null,
  notes: null,
  pickupTokenNonce: "nonce-123",
  pickupTokenExpiresAt: new Date("2030-01-01T00:00:00.000Z"),
  pickedUpAt: null,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
};

const payload = {
  orderId: baseOrder.id,
  merchantId: baseOrder.merchantId,
  issuedAt: 1_700_000_000_000,
  expiresAt: 1_700_003_600_000,
  nonce: "nonce-123",
};

describe("assertPickupAllowed", () => {
  it("allows a ready order with matching nonce", () => {
    expect(() => assertPickupAllowed(baseOrder, payload)).not.toThrow();
  });

  it("rejects missing order", () => {
    expect(() => assertPickupAllowed(undefined, payload)).toThrow(
      PickupBusinessError,
    );
    try {
      assertPickupAllowed(undefined, payload);
    } catch (error) {
      expect((error as PickupBusinessError).code).toBe("ORDER_NOT_FOUND");
    }
  });

  it("rejects already picked up order", () => {
    expect(() =>
      assertPickupAllowed(
        { ...baseOrder, status: "picked_up", pickedUpAt: new Date() },
        payload,
      ),
    ).toThrow(PickupBusinessError);
  });

  it("rejects order not in ready status", () => {
    expect(() =>
      assertPickupAllowed({ ...baseOrder, status: "placed" }, payload),
    ).toThrow(PickupBusinessError);
  });

  it("rejects nonce mismatch", () => {
    expect(() =>
      assertPickupAllowed(baseOrder, { ...payload, nonce: "other-nonce" }),
    ).toThrow(PickupBusinessError);
  });
});
