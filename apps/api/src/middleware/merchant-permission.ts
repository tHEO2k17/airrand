import type { MiddlewareHandler } from "hono";
import {
  merchantRoleCan,
  type MerchantPermissionAction,
} from "@airrand/domain";
import { getMerchantAuth } from "../lib/merchant-auth.js";
import { jsonError } from "../lib/response.js";

export function requireMerchantPermission(
  action: MerchantPermissionAction,
): MiddlewareHandler {
  return async (c, next) => {
    const auth = getMerchantAuth(c);
    if (!auth) {
      return jsonError(c, "UNAUTHORIZED", "Authentication required", 401);
    }

    if (!merchantRoleCan(auth.role, action)) {
      return jsonError(
        c,
        "forbidden",
        "You do not have permission to perform this action.",
        403,
      );
    }

    await next();
  };
}
