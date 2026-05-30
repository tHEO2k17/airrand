import type { Merchant, Order, OrderLine } from "@airrand/database";
import { describe, expect, it, vi } from "vitest";
import { getCustomerOrderStatusBySlugReferenceHandler } from "./get-customer-order-status-by-slug-reference.handler.js";
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

describe("getCustomerOrderStatusBySlugReferenceHandler", () => {
  it("returns merchant_not_found when slug does not match", async () => {
    const merchantsRepository: MerchantsRepository = {
      listOrderedByName: vi.fn(),
      findById: vi.fn(),
      findBySlug: vi.fn().mockResolvedValue(null),
    };
    const ordersRepository: OrdersRepository = {
      listByMerchantId: vi.fn(),
      listLinesByOrderIds: vi.fn(),
      listLinesByOrderId: vi.fn(),
      findByMerchantAndOrderId: vi.fn(),
      findByMerchantAndReference: vi.fn(),
    };

    const result = await getCustomerOrderStatusBySlugReferenceHandler(
      { slug: "missing", reference: "ORD-1001" },
      { merchantsRepository, ordersRepository },
    );

    expect(result).toEqual({ kind: "merchant_not_found" });
  });

  it("returns order_not_found when reference does not match merchant order", async () => {
    const merchantsRepository: MerchantsRepository = {
      listOrderedByName: vi.fn(),
      findById: vi.fn(),
      findBySlug: vi.fn().mockResolvedValue(merchant()),
    };
    const ordersRepository: OrdersRepository = {
      listByMerchantId: vi.fn(),
      listLinesByOrderIds: vi.fn(),
      listLinesByOrderId: vi.fn(),
      findByMerchantAndOrderId: vi.fn(),
      findByMerchantAndReference: vi.fn().mockResolvedValue(null),
    };

    const result = await getCustomerOrderStatusBySlugReferenceHandler(
      { slug: "kofi-mart", reference: "ORD-9999" },
      { merchantsRepository, ordersRepository },
    );

    expect(result).toEqual({ kind: "order_not_found" });
  });

  it("normalizes reference and returns customer-safe status", async () => {
    const merchantsRepository: MerchantsRepository = {
      listOrderedByName: vi.fn(),
      findById: vi.fn(),
      findBySlug: vi.fn().mockResolvedValue(merchant()),
    };
    const ordersRepository: OrdersRepository = {
      listByMerchantId: vi.fn(),
      listLinesByOrderIds: vi.fn(),
      listLinesByOrderId: vi.fn().mockResolvedValue([line()]),
      findByMerchantAndOrderId: vi.fn(),
      findByMerchantAndReference: vi.fn().mockResolvedValue(order()),
    };

    const result = await getCustomerOrderStatusBySlugReferenceHandler(
      { slug: "kofi-mart", reference: "ord-1001" },
      { merchantsRepository, ordersRepository },
    );

    expect(ordersRepository.findByMerchantAndReference).toHaveBeenCalledWith(
      merchant().id,
      "ORD-1001",
    );
    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.status.reference).toBe("ORD-1001");
      expect(result.status.merchant.slug).toBe("kofi-mart");
    }
  });
});
