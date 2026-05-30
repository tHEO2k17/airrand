import { z } from "zod";
import { NOTIFICATION_TYPES } from "./types.js";

export const orderReadyForPickupPayloadSchema = z.object({
  orderId: z.string().uuid(),
  orderReference: z.string().min(1).max(32),
  merchantId: z.string().uuid(),
});

export const auditExportCompletedPayloadSchema = z.object({
  exportJobId: z.string().uuid(),
  merchantId: z.string().uuid(),
  requestedByMerchantUserId: z.string().uuid(),
});

export const staffPasswordResetPayloadSchema = z.object({
  merchantId: z.string().uuid(),
  merchantUserId: z.string().uuid(),
  email: z.string().email(),
});

export type OrderReadyForPickupPayload = z.infer<
  typeof orderReadyForPickupPayloadSchema
>;
export type AuditExportCompletedPayload = z.infer<
  typeof auditExportCompletedPayloadSchema
>;
export type StaffPasswordResetPayload = z.infer<
  typeof staffPasswordResetPayloadSchema
>;

const payloadSchemaByType = {
  [NOTIFICATION_TYPES.ORDER_READY_FOR_PICKUP]: orderReadyForPickupPayloadSchema,
  [NOTIFICATION_TYPES.AUDIT_EXPORT_COMPLETED]: auditExportCompletedPayloadSchema,
  [NOTIFICATION_TYPES.STAFF_PASSWORD_RESET]: staffPasswordResetPayloadSchema,
} as const;

export function validateNotificationPayload(
  type: keyof typeof payloadSchemaByType,
  payload: unknown,
): Record<string, unknown> {
  const schema = payloadSchemaByType[type];
  return schema.parse(payload) as Record<string, unknown>;
}

export function parseOrderReadyForPickupPayload(
  payload: unknown,
): OrderReadyForPickupPayload {
  return orderReadyForPickupPayloadSchema.parse(payload);
}

export function parseAuditExportCompletedPayload(
  payload: unknown,
): AuditExportCompletedPayload {
  return auditExportCompletedPayloadSchema.parse(payload);
}

export function parseStaffPasswordResetPayload(
  payload: unknown,
): StaffPasswordResetPayload {
  return staffPasswordResetPayloadSchema.parse(payload);
}
