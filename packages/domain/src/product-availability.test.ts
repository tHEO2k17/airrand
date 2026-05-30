import { describe, expect, it } from "vitest";
import {
  isProductCustomerCatalogVisible,
  isProductOrderable,
} from "./product-availability.js";

describe("product availability", () => {
  const inStock = { isAvailable: true, stockState: "in_stock" as const };
  const activeCategory = { isActive: true };

  it("allows order when available and in stock", () => {
    expect(isProductOrderable(inStock, activeCategory)).toBe(true);
    expect(isProductCustomerCatalogVisible(inStock, activeCategory)).toBe(true);
  });

  it("rejects out of stock", () => {
    expect(
      isProductOrderable({ ...inStock, stockState: "out_of_stock" }, activeCategory),
    ).toBe(false);
  });

  it("rejects when isAvailable is false even if in stock", () => {
    expect(isProductOrderable({ ...inStock, isAvailable: false }, activeCategory)).toBe(
      false,
    );
  });

  it("allows low stock for ordering", () => {
    expect(
      isProductOrderable({ ...inStock, stockState: "low_stock" }, activeCategory),
    ).toBe(true);
  });

  it("rejects when category is inactive", () => {
    expect(isProductOrderable(inStock, { isActive: false })).toBe(false);
  });

  it("allows uncategorized products", () => {
    expect(isProductOrderable(inStock, null)).toBe(true);
    expect(isProductOrderable(inStock, undefined)).toBe(true);
  });
});
