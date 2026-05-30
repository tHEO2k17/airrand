import type { Context } from "hono";
import { InvalidOrderStatusTransitionError } from "@airrand/domain";
import { PickupTokenError } from "@airrand/qr";
import { PickupBusinessError } from "./pickup-verify.js";
import { jsonError } from "./response.js";

export function handleRouteError(c: Context, error: unknown) {
  if (error instanceof InvalidOrderStatusTransitionError) {
    return jsonError(c, error.code, error.message, 409);
  }

  if (error instanceof PickupTokenError) {
    const status =
      error.code === "EXPIRED_TOKEN"
        ? 410
        : 400;
    return jsonError(c, error.code, error.message, status);
  }

  if (error instanceof PickupBusinessError) {
    const status =
      error.code === "ORDER_NOT_FOUND"
        ? 404
        : error.code === "ORDER_NOT_READY" ||
            error.code === "ORDER_ALREADY_PICKED_UP"
          ? 409
          : 400;
    return jsonError(c, error.code, error.message, status);
  }

  console.error(error);
  return jsonError(c, "INTERNAL_ERROR", "An unexpected error occurred", 500);
}
