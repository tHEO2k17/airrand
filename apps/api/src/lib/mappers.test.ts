import { describe, expect, it } from "vitest";
import { toProductResponse } from "./mappers.js";
import type { Product, ProductCategory } from "@airrand/database";

describe("toProductResponse", () => {
  it("includes category summary and stock fields", () => {
    const category: ProductCategory = {
      id: "33333333-3333-3333-3333-333333333333",
      merchantId: "22222222-2222-2222-2222-222222222222",
      name: "Drinks",
      iconKey: "cup",
      sortOrder: 0,
      isActive: true,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    };

    const product: Product = {
      id: "11111111-1111-1111-1111-111111111111",
      merchantId: category.merchantId,
      categoryId: category.id,
      name: "Cold Brew",
      description: null,
      unitPriceCents: 500,
      isAvailable: true,
      stockState: "low_stock",
      stockQuantity: 3,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    };

    expect(toProductResponse(product, category)).toMatchObject({
      categoryId: category.id,
      category: {
        id: category.id,
        name: "Drinks",
        iconKey: "cup",
        isActive: true,
      },
      stockState: "low_stock",
      stockQuantity: 3,
    });
  });
});
