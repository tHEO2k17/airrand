import type { MiddlewareHandler } from "hono";
import { getInternalSetupSecret } from "../lib/internal-setup-env.js";
import { jsonError } from "../lib/response.js";

export function requireInternalSetupKey(): MiddlewareHandler {
  return async (c, next) => {
    const secret = getInternalSetupSecret();
    if (!secret) {
      return jsonError(
        c,
        "SETUP_DISABLED",
        "Internal merchant setup is not configured on this server.",
        503,
      );
    }

    const provided = c.req.header("X-Internal-Setup-Key");
    if (!provided || provided !== secret) {
      return jsonError(c, "UNAUTHORIZED", "Invalid internal setup key.", 401);
    }

    await next();
  };
}
