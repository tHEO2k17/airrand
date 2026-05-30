import { z } from "zod";
import { merchantUserResponseSchema } from "./auth.js";

export const passwordSchema = z.string().min(8).max(128);

export const changePasswordRequestSchema = z
  .object({
    currentPassword: z.string().min(1).optional(),
    newPassword: passwordSchema,
  })
  .superRefine((value, ctx) => {
    if (
      value.currentPassword &&
      value.currentPassword === value.newPassword
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "New password must differ from the current password.",
        path: ["newPassword"],
      });
    }
  });

export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;

export const changePasswordResponseSchema = z.object({
  user: merchantUserResponseSchema,
  token: z.string(),
});

export type ChangePasswordResponse = z.infer<typeof changePasswordResponseSchema>;

export const resetStaffPasswordRequestSchema = z.object({
  temporaryPassword: passwordSchema,
});

export type ResetStaffPasswordRequest = z.infer<
  typeof resetStaffPasswordRequestSchema
>;
