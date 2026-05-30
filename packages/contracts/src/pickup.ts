import { z } from "zod";
import { orderResponseSchema } from "./order.js";

export const pickupTokenResponseSchema = z.object({
  token: z.string().min(1),
  expiresAt: z.string().datetime(),
});

export type PickupTokenResponse = z.infer<typeof pickupTokenResponseSchema>;

export const pickupVerifyRequestSchema = z.object({
  token: z.string().min(1),
});

export type PickupVerifyRequest = z.infer<typeof pickupVerifyRequestSchema>;

export const pickupVerifyResponseSchema = z.object({
  order: orderResponseSchema,
  verifiedAt: z.string().datetime(),
});

export type PickupVerifyResponse = z.infer<typeof pickupVerifyResponseSchema>;

export const createOrderResponseSchema = orderResponseSchema.extend({
  pickup: pickupTokenResponseSchema,
});

export type CreateOrderResponse = z.infer<typeof createOrderResponseSchema>;
