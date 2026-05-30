import type { MiddlewareHandler } from "hono";
import { merchantUsers } from "@airrand/database";
import { eq } from "drizzle-orm";
import { db } from "../lib/db.js";
import { getMerchantAuth } from "../lib/merchant-auth.js";
import { jsonError } from "../lib/response.js";

export function requirePasswordChangeComplete(): MiddlewareHandler {
  return async (c, next) => {
    const auth = getMerchantAuth(c);
    if (!auth) {
      return jsonError(c, "UNAUTHORIZED", "Authentication required", 401);
    }

    const [user] = await db
      .select({ mustChangePassword: merchantUsers.mustChangePassword })
      .from(merchantUsers)
      .where(eq(merchantUsers.id, auth.merchantUserId))
      .limit(1);

    if (!user) {
      return jsonError(c, "UNAUTHORIZED", "Account not found", 401);
    }

    if (user.mustChangePassword) {
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
