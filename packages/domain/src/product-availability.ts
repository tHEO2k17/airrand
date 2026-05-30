export const PRODUCT_STOCK_STATES = [
  "in_stock",
  "low_stock",
  "out_of_stock",
] as const;

export type ProductStockState = (typeof PRODUCT_STOCK_STATES)[number];

export type ProductAvailabilityInput = {
  isAvailable: boolean;
  stockState: ProductStockState;
};

export type CategoryAvailabilityInput = {
  isActive: boolean;
};

export function isProductOrderable(
  product: ProductAvailabilityInput,
  category?: CategoryAvailabilityInput | null,
): boolean {
  if (!product.isAvailable) {
    return false;
  }
  if (product.stockState === "out_of_stock") {
    return false;
  }
  if (category && !category.isActive) {
    return false;
  }
  return true;
}

export function isProductCustomerCatalogVisible(
  product: ProductAvailabilityInput,
  category?: CategoryAvailabilityInput | null,
): boolean {
  return isProductOrderable(product, category);
}
