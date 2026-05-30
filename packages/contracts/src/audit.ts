import { z } from "zod";

export const auditActorTypeSchema = z.enum([
  "system",
  "merchant_staff",
  "customer",
  "unknown",
]);

export type AuditActorType = z.infer<typeof auditActorTypeSchema>;

export const auditLogResponseSchema = z.object({
  id: z.string().uuid(),
  merchantId: z.string().uuid(),
  orderId: z.string().uuid().nullable(),
  actorType: auditActorTypeSchema,
  actorLabel: z.string().nullable(),
  action: z.string(),
  metadata: z.record(z.unknown()),
  createdAt: z.string().datetime(),
});

export type AuditLogResponse = z.infer<typeof auditLogResponseSchema>;

export const listAuditLogsResponseSchema = z.object({
  auditLogs: z.array(auditLogResponseSchema),
});
