import { z } from "zod";
import { merchantStaffRoleSchema } from "./auth.js";

export const assignableStaffRoleSchema = z.enum(["manager", "staff"]);

export type AssignableStaffRole = z.infer<typeof assignableStaffRoleSchema>;

export const staffMemberResponseSchema = z.object({
  id: z.string().uuid(),
  merchantId: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().nullable(),
  role: merchantStaffRoleSchema,
  isActive: z.boolean(),
  lastLoginAt: z.string().datetime().nullable(),
  invitedAt: z.string().datetime().nullable(),
  deactivatedAt: z.string().datetime().nullable(),
  createdByMerchantUserId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type StaffMemberResponse = z.infer<typeof staffMemberResponseSchema>;

export const listStaffResponseSchema = z.object({
  staff: z.array(staffMemberResponseSchema),
});

export type ListStaffResponse = z.infer<typeof listStaffResponseSchema>;

export const createStaffRequestSchema = z.object({
  email: z.string().email(),
  displayName: z.string().trim().min(1).max(120).optional(),
  role: assignableStaffRoleSchema,
  temporaryPassword: z.string().min(8).max(128),
});

export type CreateStaffRequest = z.infer<typeof createStaffRequestSchema>;

export const createStaffResponseSchema = z.object({
  staff: staffMemberResponseSchema,
});

export type CreateStaffResponse = z.infer<typeof createStaffResponseSchema>;

export const updateStaffRoleRequestSchema = z.object({
  role: assignableStaffRoleSchema,
});

export type UpdateStaffRoleRequest = z.infer<typeof updateStaffRoleRequestSchema>;

export const updateStaffRoleResponseSchema = z.object({
  staff: staffMemberResponseSchema,
});

export type UpdateStaffRoleResponse = z.infer<typeof updateStaffRoleResponseSchema>;

export const deactivateStaffResponseSchema = z.object({
  staff: staffMemberResponseSchema,
});

export type DeactivateStaffResponse = z.infer<typeof deactivateStaffResponseSchema>;
