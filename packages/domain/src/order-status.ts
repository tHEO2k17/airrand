export const ORDER_STATUSES = [
  "placed",
  "accepted",
  "ready",
  "picked_up",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

const TERMINAL_STATUSES: ReadonlySet<OrderStatus> = new Set([
  "picked_up",
  "cancelled",
]);

const ALLOWED_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  placed: ["accepted", "cancelled"],
  accepted: ["ready", "cancelled"],
  ready: ["picked_up", "cancelled"],
  picked_up: [],
  cancelled: [],
};

export class InvalidOrderStatusTransitionError extends Error {
  readonly code = "INVALID_ORDER_STATUS_TRANSITION";

  constructor(
    public readonly from: OrderStatus,
    public readonly to: OrderStatus,
  ) {
    super(`Cannot transition order status from "${from}" to "${to}"`);
    this.name = "InvalidOrderStatusTransitionError";
  }
}

export function canTransitionOrderStatus(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  if (from === to) {
    return true;
  }
  if (TERMINAL_STATUSES.has(from)) {
    return false;
  }
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertCanTransitionOrderStatus(
  from: OrderStatus,
  to: OrderStatus,
): void {
  if (!canTransitionOrderStatus(from, to)) {
    throw new InvalidOrderStatusTransitionError(from, to);
  }
}
