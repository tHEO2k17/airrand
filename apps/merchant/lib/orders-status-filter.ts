import type { OrderResponse } from "@airrand/contracts";
import type { OrderStatus } from "@airrand/domain";
import { ORDER_STATUSES } from "@airrand/domain";

export type OrderStatusFilter = "all" | OrderStatus;

export const ORDER_STATUS_FILTER_OPTIONS: Array<{
  value: OrderStatusFilter;
  label: string;
}> = [
  { value: "all", label: "All" },
  ...ORDER_STATUSES.map((status) => ({
    value: status as OrderStatusFilter,
    label: status.replace("_", " "),
  })),
];

export function filterOrdersByStatus(
  orders: OrderResponse[],
  statusFilter: OrderStatusFilter,
): OrderResponse[] {
  if (statusFilter === "all") {
    return orders;
  }
  return orders.filter((order) => order.status === statusFilter);
}

export function countOrdersByStatus(
  orders: OrderResponse[],
): Record<OrderStatus, number> {
  const counts = Object.fromEntries(
    ORDER_STATUSES.map((status) => [status, 0]),
  ) as Record<OrderStatus, number>;

  for (const order of orders) {
    counts[order.status] += 1;
  }

  return counts;
}
