import { describe, expect, it } from "vitest";
import { assertProductOrderable } from "./product-catalog.js";
import type { Product, ProductCategory } from "@airrand/database";

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    merchantId: "22222222-2222-2222-2222-222222222222",
    categoryId: null,
    name: "Test Item",
    description: null,
    unitPriceCents: 100,
    isAvailable: true,
    stockState: "in_stock",
    stockQuantity: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function category(overrides: Partial<ProductCategory> = {}): ProductCategory {
  return {
    id: "33333333-3333-3333-3333-333333333333",
    merchantId: "22222222-2222-2222-2222-222222222222",
    name: "Snacks",
    iconKey: null,
    sortOrder: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("assertProductOrderable", () => {
  it("allows in-stock available products", () => {
    expect(assertProductOrderable(product(), null)).toEqual({ ok: true });
  });

  it("rejects out of stock", () => {
    const result = assertProductOrderable(
      product({ stockState: "out_of_stock" }),
      null,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("out of stock");
    }
  });

  it("rejects inactive category", () => {
    const result = assertProductOrderable(
      product({ categoryId: category().id }),
      category({ isActive: false }),
    );
    expect(result.ok).toBe(false);
  });
});
