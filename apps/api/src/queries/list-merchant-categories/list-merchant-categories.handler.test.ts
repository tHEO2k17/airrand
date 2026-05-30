import type { Merchant, ProductCategory } from "@airrand/database";
import { describe, expect, it, vi } from "vitest";
import { listMerchantCategoriesHandler } from "./list-merchant-categories.handler.js";
import type { CategoriesRepository } from "../../repositories/categories.repository.js";
import type { MerchantsRepository } from "../../repositories/merchants.repository.js";

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

function category(): ProductCategory {
  return {
    id: "33333333-3333-3333-3333-333333333333",
    merchantId: merchant().id,
    name: "Snacks",
    iconKey: "snack",
    sortOrder: 0,
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  };
}

describe("listMerchantCategoriesHandler", () => {
  it("returns merchant_not_found when merchant is missing", async () => {
    const merchantsRepository: MerchantsRepository = {
      listOrderedByName: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      findBySlug: vi.fn(),
    };
    const categoriesRepository: CategoriesRepository = {
      listByMerchantId: vi.fn(),
    };

    const result = await listMerchantCategoriesHandler(
      { merchantId: merchant().id },
      { merchantsRepository, categoriesRepository },
    );

    expect(result).toEqual({ kind: "merchant_not_found" });
    expect(categoriesRepository.listByMerchantId).not.toHaveBeenCalled();
  });

  it("returns mapped categories when merchant exists", async () => {
    const merchantsRepository: MerchantsRepository = {
      listOrderedByName: vi.fn(),
      findById: vi.fn().mockResolvedValue(merchant()),
      findBySlug: vi.fn(),
    };
    const categoriesRepository: CategoriesRepository = {
      listByMerchantId: vi.fn().mockResolvedValue([category()]),
    };

    const result = await listMerchantCategoriesHandler(
      { merchantId: merchant().id },
      { merchantsRepository, categoriesRepository },
    );

    expect(categoriesRepository.listByMerchantId).toHaveBeenCalledWith(
      merchant().id,
    );
    expect(result).toEqual({
      kind: "ok",
      categories: [
        {
          id: category().id,
          merchantId: merchant().id,
          name: "Snacks",
          iconKey: "snack",
          sortOrder: 0,
          isActive: true,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-02T00:00:00.000Z",
        },
      ],
    });
  });
});
