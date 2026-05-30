import type { Merchant, Order, OrderLine } from "@airrand/database";
import { describe, expect, it, vi } from "vitest";
import { getCustomerOrderStatusHandler } from "./get-customer-order-status.handler.js";
import type { MerchantsRepository } from "../../repositories/merchants.repository.js";
import type { OrdersRepository } from "../../repositories/orders.repository.js";

vi.mock("../../lib/customer-pickup-token.js", () => ({
  issueCustomerPickupToken: () => "signed-pickup-token",
}));

function merchant(): Merchant {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Kofi Mart",
    slug: "kofi-mart",
    description: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  };
}

function order(): Order {
  return {
    id: "44444444-4444-4444-4444-444444444444",
    merchantId: merchant().id,
    reference: "ORD-1001",
    status: "ready",
    customerName: "Secret",
    customerContact: "+233200000000",
    notes: null,
    pickupTokenNonce: "nonce",
    pickupTokenExpiresAt: new Date("2026-01-03T00:00:00.000Z"),
    pickedUpAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  };
}

function line(): OrderLine {
  return {
    id: "55555555-5555-5555-5555-555555555555",
    orderId: order().id,
    productId: "22222222-2222-2222-2222-222222222222",
    quantity: 1,
    productName: "Cold Brew",
    unitPriceCents: 500,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  };
}

describe("getCustomerOrderStatusHandler", () => {
  it("returns merchant_not_found when merchant is missing", async () => {
    const merchantsRepository: MerchantsRepository = {
      listOrderedByName: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      findBySlug: vi.fn(),
    };
    const ordersRepository: OrdersRepository = {
      listByMerchantId: vi.fn(),
      listLinesByOrderIds: vi.fn(),
      listLinesByOrderId: vi.fn(),
      findByMerchantAndOrderId: vi.fn(),
      findByMerchantAndReference: vi.fn(),
    };

    const result = await getCustomerOrderStatusHandler(
      { merchantId: merchant().id, orderId: order().id },
      { merchantsRepository, ordersRepository },
    );

    expect(result).toEqual({ kind: "merchant_not_found" });
  });

  it("returns order_not_found when order is missing", async () => {
    const merchantsRepository: MerchantsRepository = {
      listOrderedByName: vi.fn(),
      findById: vi.fn().mockResolvedValue(merchant()),
      findBySlug: vi.fn(),
    };
    const ordersRepository: OrdersRepository = {
      listByMerchantId: vi.fn(),
      listLinesByOrderIds: vi.fn(),
      listLinesByOrderId: vi.fn(),
      findByMerchantAndOrderId: vi.fn().mockResolvedValue(null),
      findByMerchantAndReference: vi.fn(),
    };

    const result = await getCustomerOrderStatusHandler(
      { merchantId: merchant().id, orderId: order().id },
      { merchantsRepository, ordersRepository },
    );

    expect(result).toEqual({ kind: "order_not_found" });
  });

  it("returns customer-safe order status", async () => {
    const merchantsRepository: MerchantsRepository = {
      listOrderedByName: vi.fn(),
      findById: vi.fn().mockResolvedValue(merchant()),
      findBySlug: vi.fn(),
    };
    const ordersRepository: OrdersRepository = {
      listByMerchantId: vi.fn(),
      listLinesByOrderIds: vi.fn(),
      listLinesByOrderId: vi.fn().mockResolvedValue([line()]),
      findByMerchantAndOrderId: vi.fn().mockResolvedValue(order()),
      findByMerchantAndReference: vi.fn(),
    };

    const result = await getCustomerOrderStatusHandler(
      { merchantId: merchant().id, orderId: order().id },
      { merchantsRepository, ordersRepository },
    );

    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.status.reference).toBe("ORD-1001");
      expect(result.status.pickupToken).toBe("signed-pickup-token");
      expect(JSON.stringify(result.status)).not.toContain("Secret");
    }
  });
});
