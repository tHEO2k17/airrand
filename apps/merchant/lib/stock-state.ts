import type { ProductStockState } from "@airrand/contracts";

export const STOCK_STATE_LABELS: Record<ProductStockState, string> = {
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
};

export function isProductPosDisabled(stockState: ProductStockState): boolean {
  return stockState === "out_of_stock";
}
