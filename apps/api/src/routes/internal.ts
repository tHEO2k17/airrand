import { merchantOnboardRequestSchema } from "@airrand/contracts";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { handleRouteError } from "../lib/errors.js";
import { onboardMerchant } from "../lib/merchant-onboarding.js";
import { toMerchantResponse } from "../lib/mappers.js";
import { jsonError, jsonOk } from "../lib/response.js";
import { requireInternalSetupKey } from "../middleware/internal-setup.js";

export const internalRoutes = new Hono();

internalRoutes.post(
  "/merchants/onboard",
  requireInternalSetupKey(),
  zValidator("json", merchantOnboardRequestSchema),
  async (c) => {
    try {
      const body = c.req.valid("json");
      const result = await onboardMerchant(body);

      if (!result.ok) {
        return jsonError(c, result.code, result.message, result.status);
      }

      return jsonOk(
        c,
        {
          merchant: toMerchantResponse(result.merchant),
          owner: {
            id: result.owner.id,
            email: result.owner.email,
            displayName: result.owner.displayName,
            mustChangePassword: result.owner.mustChangePassword,
          },
          temporaryPassword: result.temporaryPassword,
          storefrontPath: `/store/${result.merchant.slug}`,
        },
        201,
      );
    } catch (error) {
      return handleRouteError(c, error);
    }
  },
);
