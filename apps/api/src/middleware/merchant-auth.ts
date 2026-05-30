import type { MiddlewareHandler } from "hono";
import {
  extractSessionToken,
  verifyMerchantSessionToken,
  type MerchantAuthContext,
} from "../lib/merchant-auth.js";
import { jsonError } from "../lib/response.js";
import { SessionTokenError } from "@airrand/auth";

declare module "hono" {
  interface ContextVariableMap {
    merchantAuth: MerchantAuthContext;
  }
}

export function requireMerchantAuth(): MiddlewareHandler {
  return async (c, next) => {
    const token = extractSessionToken(c);
    if (!token) {
      return jsonError(c, "UNAUTHORIZED", "Authentication required", 401);
    }

    try {
      const payload = verifyMerchantSessionToken(token);
      const routeMerchantId = c.req.param("merchantId");
      if (routeMerchantId && payload.merchantId !== routeMerchantId) {
        return jsonError(
          c,
          "FORBIDDEN",
          "Not authorized for this merchant",
          403,
        );
      }

      c.set("merchantAuth", payload);
      await next();
    } catch (error) {
      if (error instanceof SessionTokenError) {
        const status = error.code === "EXPIRED_TOKEN" ? 401 : 401;
        return jsonError(c, error.code, error.message, status);
      }
      throw error;
    }
  };
}
