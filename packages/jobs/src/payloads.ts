import { z } from "zod";

export const auditExportRequestedPayloadSchema = z.object({
  exportJobId: z.string().uuid(),
  merchantId: z.string().uuid(),
  requestedByMerchantUserId: z.string().uuid(),
  format: z.enum(["csv"]).default("csv"),
  requestedAt: z.string().datetime(),
});

export type AuditExportRequestedPayload = z.infer<
  typeof auditExportRequestedPayloadSchema
>;

export const notificationRequestedPayloadSchema = z.object({
  notificationJobId: z.string().uuid(),
});

export type NotificationRequestedPayload = z.infer<
  typeof notificationRequestedPayloadSchema
>;

export function parseAuditExportRequestedPayload(
  data: unknown,
): AuditExportRequestedPayload {
  return auditExportRequestedPayloadSchema.parse(data);
}

export function parseNotificationRequestedPayload(
  data: unknown,
): NotificationRequestedPayload {
  return notificationRequestedPayloadSchema.parse(data);
}
