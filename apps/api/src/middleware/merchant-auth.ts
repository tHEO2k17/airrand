import type { MiddlewareHandler } from "hono";
import {
  extractSessionToken,
  verifyMerchantSessionToken,
  type MerchantAuthContext,
} from "../lib/merchant-auth.js";
import { assertSessionVersionMatches } from "../lib/merchant-session.js";
import { jsonError } from "../lib/response.js";
import { SessionTokenError } from "@airrand/auth";
import { merchantUsers } from "@airrand/database";
import { eq } from "drizzle-orm";
import { db } from "../lib/db.js";

export interface MerchantUserAuthSnapshot {
  mustChangePassword: boolean;
  sessionVersion: number;
  isActive: boolean;
}

declare module "hono" {
  interface ContextVariableMap {
    merchantAuth: MerchantAuthContext;
    merchantUserSnapshot: MerchantUserAuthSnapshot;
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

      const [user] = await db
        .select({
          sessionVersion: merchantUsers.sessionVersion,
          mustChangePassword: merchantUsers.mustChangePassword,
          isActive: merchantUsers.isActive,
        })
        .from(merchantUsers)
        .where(eq(merchantUsers.id, payload.merchantUserId))
        .limit(1);

      if (!user) {
        return jsonError(c, "UNAUTHORIZED", "Account not found", 401);
      }

      if (!user.isActive) {
        return jsonError(c, "UNAUTHORIZED", "Account is not active", 401);
      }

      try {
        assertSessionVersionMatches(payload.sessionVersion, user.sessionVersion);
      } catch (error) {
        if (error instanceof SessionTokenError && error.code === "SESSION_REVOKED") {
          return jsonError(c, "SESSION_REVOKED", error.message, 401);
        }
        throw error;
      }

      c.set("merchantAuth", payload);
      c.set("merchantUserSnapshot", {
        mustChangePassword: user.mustChangePassword,
        sessionVersion: user.sessionVersion,
        isActive: user.isActive,
      });
      await next();
    } catch (error) {
      if (error instanceof SessionTokenError) {
        return jsonError(c, error.code, error.message, 401);
      }
      throw error;
    }
  };
}
