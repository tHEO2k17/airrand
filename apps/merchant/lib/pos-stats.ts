import type { OrderResponse } from "@airrand/contracts";
import { isActiveOrderStatus } from "./order-progress";
import { getOrderCatalogTotalCents } from "./order-totals";

export interface PosDashboardStats {
  activeOrders: number;
  readyForPickup: number;
  todaysOrders: number;
  activeCatalogValueCents: number;
}

function isToday(iso: string): boolean {
  const date = new Date(iso);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function computePosDashboardStats(orders: OrderResponse[]): PosDashboardStats {
  const active = orders.filter((o) => isActiveOrderStatus(o.status));
  const ready = orders.filter((o) => o.status === "ready");
  const today = orders.filter((o) => isToday(o.createdAt));

  return {
    activeOrders: active.length,
    readyForPickup: ready.length,
    todaysOrders: today.length,
    activeCatalogValueCents: active.reduce(
      (sum, order) => sum + getOrderCatalogTotalCents(order),
      0,
    ),
  };
}
