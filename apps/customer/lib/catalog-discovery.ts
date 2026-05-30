import type { MerchantResponse, ProductResponse } from "@airrand/contracts";
import { fetchAvailableProductsBySlug, fetchMerchants } from "./api";

export type CatalogProduct = {
  product: ProductResponse;
  merchantName: string;
  merchantSlug: string;
};

export type CatalogCategoryGroup = {
  id: string;
  name: string;
  products: CatalogProduct[];
};

export async function loadCatalogProducts(): Promise<{
  products: CatalogProduct[];
  merchants: MerchantResponse[];
}> {
  const merchants = await fetchMerchants();
  const results = await Promise.all(
    merchants.map(async (merchant) => {
      try {
        const products = await fetchAvailableProductsBySlug(merchant.slug);
        return products.map((product) => ({
          product,
          merchantName: merchant.name,
          merchantSlug: merchant.slug,
        }));
      } catch {
        return [] as CatalogProduct[];
      }
    }),
  );

  const products = results
    .flat()
    .sort((a, b) => a.product.name.localeCompare(b.product.name));

  return { products, merchants };
}

export function groupCatalogByCategory(
  items: CatalogProduct[],
): CatalogCategoryGroup[] {
  const groups = new Map<string, CatalogCategoryGroup>();

  for (const item of items) {
    const category = item.product.category;
    const id = category?.id ?? "uncategorized";
    const name = category?.name ?? "More items";

    const existing = groups.get(id);
    if (existing) {
      existing.products.push(item);
      continue;
    }

    groups.set(id, {
      id,
      name,
      products: [item],
    });
  }

  return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function filterCatalogByCategory(
  items: CatalogProduct[],
  categoryId: string | "all",
): CatalogProduct[] {
  if (categoryId === "all") {
    return items;
  }
  if (categoryId === "uncategorized") {
    return items.filter((item) => !item.product.categoryId);
  }
  return items.filter((item) => item.product.categoryId === categoryId);
}
