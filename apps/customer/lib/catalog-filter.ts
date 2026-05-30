import type { ProductResponse } from "@airrand/contracts";

export type CategoryFilter = "all" | string;

export function filterProductsByCategory(
  products: ProductResponse[],
  categoryFilter: CategoryFilter,
): ProductResponse[] {
  if (categoryFilter === "all") {
    return products;
  }
  return products.filter((product) => product.categoryId === categoryFilter);
}
