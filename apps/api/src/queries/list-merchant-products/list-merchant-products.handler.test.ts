import type { Merchant, Product, ProductCategory } from "@airrand/database";
import { describe, expect, it, vi } from "vitest";
import { listMerchantProductsHandler } from "./list-merchant-products.handler.js";
import type { MerchantsRepository } from "../../repositories/merchants.repository.js";
import type { ProductsRepository } from "../../repositories/products.repository.js";

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

describe("listMerchantProductsHandler", () => {
  it("returns merchant_not_found when merchant is missing", async () => {
    const merchantsRepository: MerchantsRepository = {
      listOrderedByName: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      findBySlug: vi.fn(),
    };
    const productsRepository: ProductsRepository = {
      listWithCategories: vi.fn(),
    };

    const result = await listMerchantProductsHandler(
      { merchantId: merchant().id, query: {} },
      { merchantsRepository, productsRepository },
    );

    expect(result).toEqual({ kind: "merchant_not_found" });
  });

  it("returns validation_error for invalid query after merchant lookup", async () => {
    const merchantsRepository: MerchantsRepository = {
      listOrderedByName: vi.fn(),
      findById: vi.fn().mockResolvedValue(merchant()),
      findBySlug: vi.fn(),
    };
    const productsRepository: ProductsRepository = {
      listWithCategories: vi.fn(),
    };

    const result = await listMerchantProductsHandler(
      { merchantId: merchant().id, query: { availableOnly: "nope" } },
      { merchantsRepository, productsRepository },
    );

    expect(result.kind).toBe("validation_error");
    expect(productsRepository.listWithCategories).not.toHaveBeenCalled();
  });

  it("passes availableOnly to repository", async () => {
    const merchantsRepository: MerchantsRepository = {
      listOrderedByName: vi.fn(),
      findById: vi.fn().mockResolvedValue(merchant()),
      findBySlug: vi.fn(),
    };
    const productsRepository: ProductsRepository = {
      listWithCategories: vi.fn().mockResolvedValue([]),
    };

    await listMerchantProductsHandler(
      { merchantId: merchant().id, query: { availableOnly: "true" } },
      { merchantsRepository, productsRepository },
    );

    expect(productsRepository.listWithCategories).toHaveBeenCalledWith(
      merchant().id,
      true,
    );
  });

  it("returns mapped products on success", async () => {
    const product: Product = {
      id: "22222222-2222-2222-2222-222222222222",
      merchantId: merchant().id,
      categoryId: null,
      name: "Cold Brew",
      description: null,
      unitPriceCents: 500,
      isAvailable: true,
      stockState: "in_stock",
      stockQuantity: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    };

    const merchantsRepository: MerchantsRepository = {
      listOrderedByName: vi.fn(),
      findById: vi.fn().mockResolvedValue(merchant()),
      findBySlug: vi.fn(),
    };
    const productsRepository: ProductsRepository = {
      listWithCategories: vi
        .fn()
        .mockResolvedValue([{ product, category: null as ProductCategory | null }]),
    };

    const result = await listMerchantProductsHandler(
      { merchantId: merchant().id, query: {} },
      { merchantsRepository, productsRepository },
    );

    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.products[0]?.name).toBe("Cold Brew");
    }
  });
});
