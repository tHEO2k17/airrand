import { describe, expect, it } from "vitest";
import { filterProductsByCategory } from "./catalog-filter.js";

const products = [
  {
    id: "1",
    merchantId: "m",
    categoryId: "cat-a",
    category: { id: "cat-a", name: "Drinks", iconKey: "cup", isActive: true },
    name: "Water",
    description: null,
    unitPriceCents: 200,
    isAvailable: true,
    stockState: "in_stock" as const,
    stockQuantity: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "2",
    merchantId: "m",
    categoryId: "cat-b",
    category: { id: "cat-b", name: "Snacks", iconKey: "cookie", isActive: true },
    name: "Chips",
    description: null,
    unitPriceCents: 300,
    isAvailable: true,
    stockState: "in_stock" as const,
    stockQuantity: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "3",
    merchantId: "m",
    categoryId: null,
    category: null,
    name: "Misc",
    description: null,
    unitPriceCents: 100,
    isAvailable: true,
    stockState: "in_stock" as const,
    stockQuantity: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

describe("filterProductsByCategory", () => {
  it("returns all products when filter is all", () => {
    expect(filterProductsByCategory(products, "all")).toHaveLength(3);
  });

  it("filters by category id", () => {
    const filtered = filterProductsByCategory(products, "cat-a");
    expect(filtered.map((p) => p.name)).toEqual(["Water"]);
  });

  it("excludes uncategorized products when a category is selected", () => {
    expect(filterProductsByCategory(products, "cat-b")).toHaveLength(1);
    expect(filterProductsByCategory(products, "cat-a")).not.toContainEqual(
      expect.objectContaining({ name: "Misc" }),
    );
  });
});
