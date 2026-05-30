import { describe, expect, it } from "vitest";
import {
  defaultHomeBrowseTab,
  HOME_BROWSE_TABS,
  isHomeBrowseTab,
} from "./home-navigation.js";
import {
  filterCatalogByCategory,
  groupCatalogByCategory,
} from "./catalog-discovery.js";
import type { CatalogProduct } from "./catalog-discovery.js";

describe("home navigation", () => {
  it("defaults to product-first browse tab", () => {
    expect(defaultHomeBrowseTab()).toBe("products");
  });

  it("exposes products before shops in tab order", () => {
    expect(HOME_BROWSE_TABS[0]?.id).toBe("products");
    expect(HOME_BROWSE_TABS[1]?.id).toBe("shops");
  });

  it("validates browse tabs", () => {
    expect(isHomeBrowseTab("products")).toBe(true);
    expect(isHomeBrowseTab("shops")).toBe(true);
    expect(isHomeBrowseTab("map")).toBe(false);
  });
});

describe("catalog discovery helpers", () => {
  const sample: CatalogProduct[] = [
    {
      merchantName: "Demo",
      merchantSlug: "demo-cafe",
      product: {
        id: "1",
        merchantId: "m",
        categoryId: "c1",
        category: {
          id: "c1",
          name: "Drinks",
          iconKey: "cup",
          isActive: true,
        },
        name: "Espresso",
        description: null,
        unitPriceCents: 350,
        isAvailable: true,
        stockState: "in_stock",
        stockQuantity: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    },
    {
      merchantName: "Demo",
      merchantSlug: "demo-cafe",
      product: {
        id: "2",
        merchantId: "m",
        categoryId: null,
        category: null,
        name: "Misc",
        description: null,
        unitPriceCents: 100,
        isAvailable: true,
        stockState: "in_stock",
        stockQuantity: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    },
  ];

  it("groups products by category", () => {
    const groups = groupCatalogByCategory(sample);
    expect(groups).toHaveLength(2);
    expect(groups.find((g) => g.name === "Drinks")?.products).toHaveLength(1);
  });

  it("filters catalog by category id", () => {
    const filtered = filterCatalogByCategory(sample, "c1");
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.product.name).toBe("Espresso");
  });
});
