import type { MiddlewareHandler } from "hono";
import { jsonError } from "../lib/response.js";

export function requirePasswordChangeComplete(): MiddlewareHandler {
  return async (c, next) => {
    const snapshot = c.get("merchantUserSnapshot");
    if (!snapshot) {
      return jsonError(c, "UNAUTHORIZED", "Authentication required", 401);
    }

    if (snapshot.mustChangePassword) {
      return jsonError(
        c,
        "PASSWORD_CHANGE_REQUIRED",
        "You must change your password before continuing.",
        403,
      );
    }

    await next();
  };
}
