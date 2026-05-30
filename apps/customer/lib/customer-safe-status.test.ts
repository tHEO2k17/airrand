import { describe, expect, it } from "vitest";
import type { CustomerOrderStatusResponse } from "@airrand/contracts";

function assertCustomerSafeStatus(status: CustomerOrderStatusResponse): void {
  const serialized = JSON.stringify(status);
  expect(serialized).not.toContain("customerContact");
  expect(serialized).not.toContain("customerName");
  expect(serialized).not.toContain("pickupTokenNonce");
  expect(serialized).not.toContain("passwordHash");
}

describe("customer-safe status expectations", () => {
  it("allows pickup token and merchant slug for storefront tracking", () => {
    const status: CustomerOrderStatusResponse = {
      id: "order-1",
      reference: "ORD-1001",
      status: "ready",
      createdAt: "2026-01-01T12:00:00.000Z",
      updatedAt: "2026-01-01T12:05:00.000Z",
      pickedUpAt: null,
      pickupTokenExpiresAt: "2026-01-03T12:00:00.000Z",
      pickupToken: "signed-token",
      lines: [{ productName: "Latte", quantity: 1 }],
      merchant: {
        id: "merchant-1",
        name: "Demo Cafe",
        slug: "demo-cafe",
      },
    };

    assertCustomerSafeStatus(status);
    expect(status.merchant.slug).toBe("demo-cafe");
    expect(status.pickupToken).toBeTruthy();
  });
});
