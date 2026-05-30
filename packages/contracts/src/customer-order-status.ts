import { z } from "zod";
import { orderStatusSchema } from "./order-status.js";

export const customerOrderStatusLineSchema = z.object({
  productName: z.string(),
  quantity: z.number().int(),
});

export type CustomerOrderStatusLine = z.infer<typeof customerOrderStatusLineSchema>;

export const customerOrderStatusMerchantSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export type CustomerOrderStatusMerchant = z.infer<
  typeof customerOrderStatusMerchantSchema
>;

export const customerOrderStatusResponseSchema = z.object({
  id: z.string().uuid(),
  reference: z.string().min(1),
  status: orderStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  pickedUpAt: z.string().datetime().nullable(),
  pickupTokenExpiresAt: z.string().datetime().nullable(),
  lines: z.array(customerOrderStatusLineSchema),
  merchant: customerOrderStatusMerchantSchema,
});

export type CustomerOrderStatusResponse = z.infer<
  typeof customerOrderStatusResponseSchema
>;
