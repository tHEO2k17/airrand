import { canTransitionOrderStatus, type OrderStatus } from "@airrand/domain";
import type { OrderResponse } from "@airrand/contracts";

export interface OrderStatusAction {
  label: string;
  status: OrderStatus;
}

const ACTION_LABELS: Record<OrderStatus, string> = {
  accepted: "Accept",
  ready: "Mark ready",
  cancelled: "Cancel",
  placed: "Place",
  picked_up: "Picked up",
};

export function getAvailableOrderActions(
  order: OrderResponse,
): OrderStatusAction[] {
  const targets: OrderStatus[] = [
    "accepted",
    "ready",
    "cancelled",
  ];

  return targets
    .filter(
      (status) =>
        status !== order.status &&
        canTransitionOrderStatus(order.status, status),
    )
    .map((status) => ({
      status,
      label: ACTION_LABELS[status],
    }));
}
