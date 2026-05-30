import { z } from "zod";
import { merchantResponseSchema } from "./merchant.js";

export const merchantOnboardRequestSchema = z.object({
  merchantName: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(64),
  description: z.string().trim().max(500).nullable().optional(),
  ownerEmail: z.string().email(),
  ownerDisplayName: z.string().trim().min(1).max(120).optional(),
});

export type MerchantOnboardRequest = z.infer<typeof merchantOnboardRequestSchema>;

export const merchantOnboardOwnerResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().nullable(),
  mustChangePassword: z.boolean(),
});

export type MerchantOnboardOwnerResponse = z.infer<
  typeof merchantOnboardOwnerResponseSchema
>;

export const merchantOnboardResponseSchema = z.object({
  merchant: merchantResponseSchema,
  owner: merchantOnboardOwnerResponseSchema,
  temporaryPassword: z.string().min(8),
  storefrontPath: z.string(),
});

export type MerchantOnboardResponse = z.infer<typeof merchantOnboardResponseSchema>;

export const updateMerchantSettingsSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(500).nullable().optional(),
    slug: z.string().trim().min(1).max(64).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export type UpdateMerchantSettingsInput = z.infer<typeof updateMerchantSettingsSchema>;
