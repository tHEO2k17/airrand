import type { OrderResponse } from "@airrand/contracts";
import { POLL_NEW_ORDER_MAX_AGE_MS } from "./constants";

export function collectOrderIds(orders: OrderResponse[]): Set<string> {
  return new Set(orders.map((order) => order.id));
}

export function detectNewOrdersOnRefresh(options: {
  previousIds: ReadonlySet<string>;
  orders: OrderResponse[];
  now?: number;
  maxAgeMs?: number;
}): OrderResponse[] {
  const now = options.now ?? Date.now();
  const maxAgeMs = options.maxAgeMs ?? POLL_NEW_ORDER_MAX_AGE_MS;

  return options.orders.filter((order) => {
    if (options.previousIds.has(order.id)) {
      return false;
    }
    const ageMs = now - new Date(order.createdAt).getTime();
    return ageMs >= 0 && ageMs <= maxAgeMs;
  });
}

export function isRecentOrder(
  order: OrderResponse,
  now = Date.now(),
  windowMs = POLL_NEW_ORDER_MAX_AGE_MS,
): boolean {
  const ageMs = now - new Date(order.createdAt).getTime();
  return ageMs >= 0 && ageMs <= windowMs;
}
