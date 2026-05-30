import { z } from "zod";

export const merchantStaffRoleSchema = z.enum(["owner", "manager", "staff"]);

export type MerchantStaffRole = z.infer<typeof merchantStaffRoleSchema>;

export const merchantLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type MerchantLoginInput = z.infer<typeof merchantLoginSchema>;

export const merchantUserResponseSchema = z.object({
  id: z.string().uuid(),
  merchantId: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().nullable(),
  role: merchantStaffRoleSchema,
  isActive: z.boolean(),
  lastLoginAt: z.string().datetime().nullable(),
});

export type MerchantUserResponse = z.infer<typeof merchantUserResponseSchema>;

export const merchantAuthResponseSchema = z.object({
  user: merchantUserResponseSchema,
  merchant: z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
  }),
  token: z.string(),
});

export type MerchantAuthResponse = z.infer<typeof merchantAuthResponseSchema>;

export const merchantMeResponseSchema = z.object({
  user: merchantUserResponseSchema,
  merchant: z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
  }),
});

export type MerchantMeResponse = z.infer<typeof merchantMeResponseSchema>;
