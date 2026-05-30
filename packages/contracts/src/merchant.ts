import { z } from "zod";

export const merchantResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type MerchantResponse = z.infer<typeof merchantResponseSchema>;

export const listMerchantsResponseSchema = z.object({
  merchants: z.array(merchantResponseSchema),
});

export const merchantBySlugResponseSchema = merchantResponseSchema;

export type MerchantBySlugResponse = z.infer<typeof merchantBySlugResponseSchema>;
