import type { Order } from "@airrand/database";
import type { PickupTokenPayload } from "@airrand/qr";

export type PickupBusinessErrorCode =
  | "ORDER_NOT_FOUND"
  | "ORDER_NOT_READY"
  | "ORDER_ALREADY_PICKED_UP"
  | "TOKEN_NONCE_MISMATCH";

export class PickupBusinessError extends Error {
  constructor(
    public readonly code: PickupBusinessErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "PickupBusinessError";
  }
}

export function assertPickupAllowed(
  order: Order | undefined,
  payload: PickupTokenPayload,
): asserts order is Order {
  if (!order) {
    throw new PickupBusinessError("ORDER_NOT_FOUND", "Order not found");
  }

  if (order.pickedUpAt || order.status === "picked_up") {
    throw new PickupBusinessError(
      "ORDER_ALREADY_PICKED_UP",
      "Order has already been picked up",
    );
  }

  if (order.status !== "ready") {
    throw new PickupBusinessError(
      "ORDER_NOT_READY",
      "Order is not ready for pickup",
    );
  }

  if (!order.pickupTokenNonce || order.pickupTokenNonce !== payload.nonce) {
    throw new PickupBusinessError(
      "TOKEN_NONCE_MISMATCH",
      "Pickup token is not valid for this order",
    );
  }
}
