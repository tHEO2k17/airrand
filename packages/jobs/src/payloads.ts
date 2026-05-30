import { z } from "zod";

export const auditExportRequestedPayloadSchema = z.object({
  merchantId: z.string().uuid(),
  requestedByMerchantUserId: z.string().uuid(),
  format: z.enum(["csv"]).default("csv"),
  requestedAt: z.string().datetime(),
});

export type AuditExportRequestedPayload = z.infer<
  typeof auditExportRequestedPayloadSchema
>;

export const notificationPlaceholderPayloadSchema = z.object({
  merchantId: z.string().uuid(),
  channel: z.literal("placeholder"),
  template: z.string().min(1).max(120),
  metadata: z.record(z.unknown()).optional(),
});

export type NotificationPlaceholderPayload = z.infer<
  typeof notificationPlaceholderPayloadSchema
>;

export function parseAuditExportRequestedPayload(
  data: unknown,
): AuditExportRequestedPayload {
  return auditExportRequestedPayloadSchema.parse(data);
}

export function parseNotificationPlaceholderPayload(
  data: unknown,
): NotificationPlaceholderPayload {
  return notificationPlaceholderPayloadSchema.parse(data);
}
