import type { OrderResponse } from "@airrand/contracts";

export function getOrderItemCount(order: OrderResponse): number {
  return order.lines.reduce((sum, line) => sum + line.quantity, 0);
}

/** Catalog line totals only — not a payment or checkout amount. */
export function getOrderCatalogTotalCents(order: OrderResponse): number {
  return order.lines.reduce(
    (sum, line) => sum + line.quantity * line.unitPriceCents,
    0,
  );
}
