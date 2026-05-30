import {
  changePasswordRequestSchema,
  merchantLoginSchema,
} from "@airrand/contracts";
import {
  createSessionToken,
  hashPassword,
  SessionTokenError,
  verifyPassword,
} from "@airrand/auth";
import {
  AUDIT_ACTIONS,
  insertAuditLogSafe,
  merchantUsers,
  merchants,
} from "@airrand/database";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import {
  getAuthSessionSecret,
  getAuthSessionTtlMs,
  SESSION_COOKIE_NAME,
} from "../lib/auth-env.js";
import { db } from "../lib/db.js";
import { handleRouteError } from "../lib/errors.js";
import { getMerchantActor } from "../lib/merchant-auth.js";
import { toMerchantUserResponse } from "../lib/mappers.js";
import { jsonError, jsonOk } from "../lib/response.js";
import { requireMerchantAuth } from "../middleware/merchant-auth.js";

export const authRoutes = new Hono();

function setSessionCookie(c: Parameters<typeof setCookie>[0], token: string, ttlMs: number) {
  const maxAgeSeconds = Math.floor(ttlMs / 1000);
  setCookie(c, SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

function issueSessionResponse(
  c: Parameters<typeof jsonOk>[0],
  user: typeof merchantUsers.$inferSelect,
  merchant: typeof merchants.$inferSelect,
) {
  const ttlMs = getAuthSessionTtlMs();
  const { token } = createSessionToken({
    merchantUserId: user.id,
    merchantId: user.merchantId,
    role: user.role,
    email: user.email,
    secret: getAuthSessionSecret(),
    ttlMs,
  });

  setSessionCookie(c, token, ttlMs);

  return jsonOk(c, {
    user: toMerchantUserResponse(user),
    merchant: {
      id: merchant.id,
      name: merchant.name,
      slug: merchant.slug,
    },
    token,
  });
}

authRoutes.post(
  "/merchant/login",
  zValidator("json", merchantLoginSchema),
  async (c) => {
    try {
      const body = c.req.valid("json");

      const [user] = await db
        .select()
        .from(merchantUsers)
        .where(eq(merchantUsers.email, body.email.trim().toLowerCase()))
        .limit(1);

      if (!user || !user.isActive || !user.passwordHash) {
        return jsonError(c, "INVALID_CREDENTIALS", "Invalid email or password", 401);
      }

      const passwordValid = await verifyPassword(body.password, user.passwordHash);
      if (!passwordValid) {
        return jsonError(c, "INVALID_CREDENTIALS", "Invalid email or password", 401);
      }

      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.id, user.merchantId))
        .limit(1);

      if (!merchant) {
        return jsonError(c, "MERCHANT_NOT_FOUND", "Merchant not found", 404);
      }

      const now = new Date();
      const [updatedUser] = await db
        .update(merchantUsers)
        .set({ lastLoginAt: now, updatedAt: now })
        .where(eq(merchantUsers.id, user.id))
        .returning();

      return issueSessionResponse(c, updatedUser ?? { ...user, lastLoginAt: now }, merchant);
    } catch (error) {
      return handleRouteError(c, error);
    }
  },
);

authRoutes.post("/merchant/logout", async (c) => {
  deleteCookie(c, SESSION_COOKIE_NAME, { path: "/" });
  return jsonOk(c, { loggedOut: true });
});

authRoutes.get("/merchant/me", requireMerchantAuth(), async (c) => {
  try {
    const session = c.get("merchantAuth");

    const [user] = await db
      .select()
      .from(merchantUsers)
      .where(eq(merchantUsers.id, session.merchantUserId))
      .limit(1);

    if (!user || !user.isActive) {
      return jsonError(c, "UNAUTHORIZED", "Account is not active", 401);
    }

    const [merchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.id, user.merchantId))
      .limit(1);

    if (!merchant) {
      return jsonError(c, "MERCHANT_NOT_FOUND", "Merchant not found", 404);
    }

    return jsonOk(c, {
      user: toMerchantUserResponse(user),
      merchant: {
        id: merchant.id,
        name: merchant.name,
        slug: merchant.slug,
      },
    });
  } catch (error) {
    if (error instanceof SessionTokenError) {
      return jsonError(c, error.code, error.message, 401);
    }
    return handleRouteError(c, error);
  }
});

authRoutes.post(
  "/merchant/change-password",
  requireMerchantAuth(),
  zValidator("json", changePasswordRequestSchema),
  async (c) => {
    try {
      const body = c.req.valid("json");
      const session = c.get("merchantAuth");

      const [user] = await db
        .select()
        .from(merchantUsers)
        .where(eq(merchantUsers.id, session.merchantUserId))
        .limit(1);

      if (!user || !user.isActive || !user.passwordHash) {
        return jsonError(c, "UNAUTHORIZED", "Account is not active", 401);
      }

      if (!user.mustChangePassword) {
        if (!body.currentPassword) {
          return jsonError(
            c,
            "VALIDATION_ERROR",
            "Current password is required.",
            400,
          );
        }

        const currentValid = await verifyPassword(
          body.currentPassword,
          user.passwordHash,
        );
        if (!currentValid) {
          return jsonError(
            c,
            "INVALID_CREDENTIALS",
            "Current password is incorrect.",
            401,
          );
        }
      }

      const passwordHash = await hashPassword(body.newPassword);
      const now = new Date();
      const [updated] = await db
        .update(merchantUsers)
        .set({
          passwordHash,
          mustChangePassword: false,
          updatedAt: now,
        })
        .where(eq(merchantUsers.id, user.id))
        .returning();

      if (!updated) {
        return jsonError(c, "INTERNAL_ERROR", "Failed to update password", 500);
      }

      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.id, user.merchantId))
        .limit(1);

      if (!merchant) {
        return jsonError(c, "MERCHANT_NOT_FOUND", "Merchant not found", 404);
      }

      const actor = getMerchantActor(c);
      await insertAuditLogSafe(db, {
        merchantId: user.merchantId,
        ...actor,
        action: AUDIT_ACTIONS.STAFF_PASSWORD_CHANGED,
        metadata: {
          merchantUserId: user.id,
          forced: user.mustChangePassword,
        },
      });

      const ttlMs = getAuthSessionTtlMs();
      const { token } = createSessionToken({
        merchantUserId: updated.id,
        merchantId: updated.merchantId,
        role: updated.role,
        email: updated.email,
        secret: getAuthSessionSecret(),
        ttlMs,
      });

      setSessionCookie(c, token, ttlMs);

      return jsonOk(c, {
        user: toMerchantUserResponse(updated),
        token,
      });
    } catch (error) {
      return handleRouteError(c, error);
    }
  },
);
