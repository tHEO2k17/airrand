import type { Merchant, Order, OrderLine } from "@airrand/database";
import { describe, expect, it, vi } from "vitest";
import { listMerchantOrdersHandler } from "./list-merchant-orders.handler.js";
import type { MerchantsRepository } from "../../repositories/merchants.repository.js";
import type { OrdersRepository } from "../../repositories/orders.repository.js";

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
    status: "placed",
    customerName: "Alex",
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

describe("listMerchantOrdersHandler", () => {
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

    const result = await listMerchantOrdersHandler(
      { merchantId: merchant().id, query: {} },
      { merchantsRepository, ordersRepository },
    );

    expect(result).toEqual({ kind: "merchant_not_found" });
  });

  it("returns validation_error for invalid query", async () => {
    const merchantsRepository: MerchantsRepository = {
      listOrderedByName: vi.fn(),
      findById: vi.fn().mockResolvedValue(merchant()),
      findBySlug: vi.fn(),
    };
    const ordersRepository: OrdersRepository = {
      listByMerchantId: vi.fn(),
      listLinesByOrderIds: vi.fn(),
      listLinesByOrderId: vi.fn(),
      findByMerchantAndOrderId: vi.fn(),
      findByMerchantAndReference: vi.fn(),
    };

    const result = await listMerchantOrdersHandler(
      { merchantId: merchant().id, query: { reference: "" } },
      { merchantsRepository, ordersRepository },
    );

    expect(result.kind).toBe("validation_error");
  });

  it("returns mapped orders with lines", async () => {
    const merchantsRepository: MerchantsRepository = {
      listOrderedByName: vi.fn(),
      findById: vi.fn().mockResolvedValue(merchant()),
      findBySlug: vi.fn(),
    };
    const ordersRepository: OrdersRepository = {
      listByMerchantId: vi.fn().mockResolvedValue([order()]),
      listLinesByOrderIds: vi.fn().mockResolvedValue([line()]),
      listLinesByOrderId: vi.fn(),
      findByMerchantAndOrderId: vi.fn(),
      findByMerchantAndReference: vi.fn(),
    };

    const result = await listMerchantOrdersHandler(
      { merchantId: merchant().id, query: {} },
      { merchantsRepository, ordersRepository },
    );

    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.orders[0]?.reference).toBe("ORD-1001");
      expect(result.orders[0]?.lines[0]?.productName).toBe("Cold Brew");
    }
  });

  it("filters by normalized reference when provided", async () => {
    const merchantsRepository: MerchantsRepository = {
      listOrderedByName: vi.fn(),
      findById: vi.fn().mockResolvedValue(merchant()),
      findBySlug: vi.fn(),
    };
    const ordersRepository: OrdersRepository = {
      listByMerchantId: vi.fn().mockResolvedValue([]),
      listLinesByOrderIds: vi.fn().mockResolvedValue([]),
      listLinesByOrderId: vi.fn(),
      findByMerchantAndOrderId: vi.fn(),
      findByMerchantAndReference: vi.fn(),
    };

    await listMerchantOrdersHandler(
      { merchantId: merchant().id, query: { reference: "ord-1001" } },
      { merchantsRepository, ordersRepository },
    );

    expect(ordersRepository.listByMerchantId).toHaveBeenCalledWith(
      merchant().id,
      "ORD-1001",
    );
  });
});
