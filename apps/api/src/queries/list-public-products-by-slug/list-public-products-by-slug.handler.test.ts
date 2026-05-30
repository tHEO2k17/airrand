import type { Merchant, Product, ProductCategory } from "@airrand/database";
import { describe, expect, it, vi } from "vitest";
import { listPublicProductsBySlugHandler } from "./list-public-products-by-slug.handler.js";
import type { MerchantsRepository } from "../../repositories/merchants.repository.js";
import type { ProductsRepository } from "../../repositories/products.repository.js";

function merchant(overrides: Partial<Merchant> = {}): Merchant {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Kofi Mart",
    slug: "kofi-mart",
    description: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    ...overrides,
  };
}

function product(overrides: Partial<Product> = {}): Product {
  return {
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
    ...overrides,
  };
}

describe("listPublicProductsBySlugHandler", () => {
  it("returns not_found when merchant is missing", async () => {
    const merchantsRepository: MerchantsRepository = {
      listOrderedByName: vi.fn(),
      findById: vi.fn(),
      findBySlug: vi.fn().mockResolvedValue(null),
    };
    const productsRepository: ProductsRepository = {
      listWithCategories: vi.fn(),
    };

    const result = await listPublicProductsBySlugHandler(
      { slug: "missing", query: {} },
      { merchantsRepository, productsRepository },
    );

    expect(result).toEqual({ kind: "not_found" });
    expect(productsRepository.listWithCategories).not.toHaveBeenCalled();
  });

  it("returns validation_error for invalid query after merchant lookup", async () => {
    const merchantsRepository: MerchantsRepository = {
      listOrderedByName: vi.fn(),
      findById: vi.fn(),
      findBySlug: vi.fn().mockResolvedValue(merchant()),
    };
    const productsRepository: ProductsRepository = {
      listWithCategories: vi.fn(),
    };

    const result = await listPublicProductsBySlugHandler(
      { slug: "kofi-mart", query: { availableOnly: "not-a-boolean" } },
      { merchantsRepository, productsRepository },
    );

    expect(result.kind).toBe("validation_error");
    expect(productsRepository.listWithCategories).not.toHaveBeenCalled();
  });

  it("defaults availableOnly to false when query param is omitted", async () => {
    const merchantsRepository: MerchantsRepository = {
      listOrderedByName: vi.fn(),
      findById: vi.fn(),
      findBySlug: vi.fn().mockResolvedValue(merchant()),
    };
    const productsRepository: ProductsRepository = {
      listWithCategories: vi.fn().mockResolvedValue([]),
    };

    await listPublicProductsBySlugHandler(
      { slug: "kofi-mart", query: {} },
      { merchantsRepository, productsRepository },
    );

    expect(productsRepository.listWithCategories).toHaveBeenCalledWith(
      merchant().id,
      false,
    );
  });

  it("returns mapped products when merchant and query are valid", async () => {
    const category: ProductCategory = {
      id: "33333333-3333-3333-3333-333333333333",
      merchantId: merchant().id,
      name: "Drinks",
      iconKey: "cup",
      sortOrder: 0,
      isActive: true,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    };

    const merchantsRepository: MerchantsRepository = {
      listOrderedByName: vi.fn(),
      findById: vi.fn(),
      findBySlug: vi.fn().mockResolvedValue(merchant()),
    };
    const productsRepository: ProductsRepository = {
      listWithCategories: vi
        .fn()
        .mockResolvedValue([{ product: product(), category }]),
    };

    const result = await listPublicProductsBySlugHandler(
      { slug: "kofi-mart", query: { availableOnly: "true" } },
      { merchantsRepository, productsRepository },
    );

    expect(productsRepository.listWithCategories).toHaveBeenCalledWith(
      merchant().id,
      true,
    );
    expect(result).toEqual({
      kind: "ok",
      products: [
        {
          id: "22222222-2222-2222-2222-222222222222",
          merchantId: merchant().id,
          categoryId: null,
          name: "Cold Brew",
          description: null,
          unitPriceCents: 500,
          isAvailable: true,
          stockState: "in_stock",
          stockQuantity: null,
          category: {
            id: category.id,
            name: "Drinks",
            iconKey: "cup",
            isActive: true,
          },
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-02T00:00:00.000Z",
        },
      ],
    });
  });
});
