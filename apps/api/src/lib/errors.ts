import type { Context } from "hono";
import { InvalidOrderStatusTransitionError } from "@airrand/domain";
import { jsonError } from "./response.js";

export function handleRouteError(c: Context, error: unknown) {
  if (error instanceof InvalidOrderStatusTransitionError) {
    return jsonError(c, error.code, error.message, 409);
  }

  console.error(error);
  return jsonError(c, "INTERNAL_ERROR", "An unexpected error occurred", 500);
}
