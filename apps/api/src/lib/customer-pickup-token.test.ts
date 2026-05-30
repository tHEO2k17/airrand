import { describe, expect, it, vi, beforeEach } from "vitest";
import { issueCustomerPickupToken } from "./customer-pickup-token.js";

vi.mock("./qr.js", () => ({
  getQrSigningSecret: () => "test-secret-with-at-least-32-characters",
}));

describe("issueCustomerPickupToken", () => {
  const baseOrder = {
    id: "order-1",
    reference: "ORD-1001",
    merchantId: "merchant-1",
    customerName: null,
    customerContact: null,
    notes: null,
    pickupTokenNonce: "nonce-123",
    pickupTokenExpiresAt: new Date("2030-01-01T00:00:00.000Z"),
    pickedUpAt: null,
    createdAt: new Date("2026-01-01T12:00:00.000Z"),
    updatedAt: new Date("2026-01-01T12:05:00.000Z"),
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));
  });

  it("returns a token for ready orders", () => {
    const token = issueCustomerPickupToken(
      { ...baseOrder, status: "ready" },
      "merchant-1",
    );
    expect(token).toBeTruthy();
    expect(typeof token).toBe("string");
  });

  it("returns null for placed orders", () => {
    expect(
      issueCustomerPickupToken({ ...baseOrder, status: "placed" }, "merchant-1"),
    ).toBeNull();
  });

  it("returns null when pickup credentials are missing", () => {
    expect(
      issueCustomerPickupToken(
        {
          ...baseOrder,
          status: "ready",
          pickupTokenNonce: null,
          pickupTokenExpiresAt: null,
        },
        "merchant-1",
      ),
    ).toBeNull();
  });
});
