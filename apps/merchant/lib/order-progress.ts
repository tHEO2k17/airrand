import type { OrderStatus } from "@airrand/domain";

const PROGRESS_BY_STATUS: Record<OrderStatus, number> = {
  placed: 25,
  accepted: 50,
  ready: 75,
  picked_up: 100,
  cancelled: 0,
};

const ACTION_HINT_BY_STATUS: Record<OrderStatus, string> = {
  placed: "Awaiting acceptance",
  accepted: "In preparation",
  ready: "Verify pickup when customer arrives",
  picked_up: "Complete",
  cancelled: "Cancelled",
};

export function getOrderProgressPercent(status: OrderStatus): number {
  return PROGRESS_BY_STATUS[status];
}

export function getOrderActionHint(status: OrderStatus): string {
  return ACTION_HINT_BY_STATUS[status];
}

export function isActiveOrderStatus(status: OrderStatus): boolean {
  return status === "placed" || status === "accepted" || status === "ready";
}
