import { updateMerchantSettingsSchema } from "@airrand/contracts";
import {
  normalizeMerchantSlug,
  validateMerchantSettingsSlug,
} from "@airrand/domain";
import { merchants } from "@airrand/database";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../lib/db.js";
import { handleRouteError } from "../lib/errors.js";
import { findMerchantById } from "../lib/merchant-lookup.js";
import { isMerchantSlugTaken } from "../lib/merchant-onboarding.js";
import { toMerchantResponse } from "../lib/mappers.js";
import { getMerchantAuth } from "../lib/merchant-auth.js";
import { jsonError, jsonOk } from "../lib/response.js";
import { requireMerchantAuth } from "../middleware/merchant-auth.js";
import { requirePasswordChangeComplete } from "../middleware/require-password-change-complete.js";
import type { MiddlewareHandler } from "hono";

export const merchantSettingsRoutes = new Hono();

function requireMerchantOwner(): MiddlewareHandler {
  return async (c, next) => {
    const auth = getMerchantAuth(c);
    if (!auth || auth.role !== "owner") {
      return jsonError(
        c,
        "forbidden",
        "Only the merchant owner can manage settings.",
        403,
      );
    }
    await next();
  };
}

merchantSettingsRoutes.get(
  "/:merchantId/settings",
  requireMerchantAuth(),
  requirePasswordChangeComplete(),
  requireMerchantOwner(),
  async (c) => {
    try {
      const merchantId = c.req.param("merchantId");
      const auth = getMerchantAuth(c)!;
      if (auth.merchantId !== merchantId) {
        return jsonError(c, "forbidden", "Merchant access denied.", 403);
      }

      const merchant = await findMerchantById(merchantId);
      if (!merchant) {
        return jsonError(c, "MERCHANT_NOT_FOUND", "Merchant not found", 404);
      }

      return jsonOk(c, toMerchantResponse(merchant));
    } catch (error) {
      return handleRouteError(c, error);
    }
  },
);

merchantSettingsRoutes.patch(
  "/:merchantId/settings",
  requireMerchantAuth(),
  requirePasswordChangeComplete(),
  requireMerchantOwner(),
  zValidator("json", updateMerchantSettingsSchema),
  async (c) => {
    try {
      const merchantId = c.req.param("merchantId");
      const body = c.req.valid("json");
      const auth = getMerchantAuth(c)!;
      if (auth.merchantId !== merchantId) {
        return jsonError(c, "forbidden", "Merchant access denied.", 403);
      }

      const merchant = await findMerchantById(merchantId);
      if (!merchant) {
        return jsonError(c, "MERCHANT_NOT_FOUND", "Merchant not found", 404);
      }

      const updates: Partial<typeof merchants.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (body.name !== undefined) {
        updates.name = body.name.trim();
      }

      if (body.description !== undefined) {
        updates.description =
          body.description === null ? null : body.description.trim() || null;
      }

      if (body.slug !== undefined) {
        const slugError = validateMerchantSettingsSlug(body.slug);
        if (slugError) {
          return jsonError(c, "VALIDATION_ERROR", slugError, 400);
        }

        const normalizedSlug = normalizeMerchantSlug(body.slug);
        if (await isMerchantSlugTaken(normalizedSlug, merchantId)) {
          return jsonError(
            c,
            "SLUG_IN_USE",
            "Another merchant already uses this slug.",
            409,
          );
        }
        updates.slug = normalizedSlug;
      }

      const [updated] = await db
        .update(merchants)
        .set(updates)
        .where(eq(merchants.id, merchantId))
        .returning();

      if (!updated) {
        return jsonError(c, "UPDATE_FAILED", "Failed to update merchant.", 500);
      }

      return jsonOk(c, toMerchantResponse(updated));
    } catch (error) {
      return handleRouteError(c, error);
    }
  },
);
