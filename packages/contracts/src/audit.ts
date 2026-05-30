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
  orderReference: z.string().nullable().optional(),
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

export const auditExportRequestSchema = z.object({
  format: z.enum(["csv"]).default("csv"),
});

export type AuditExportRequest = z.infer<typeof auditExportRequestSchema>;

export const auditExportQueuedResponseSchema = z.object({
  exportJobId: z.string().uuid(),
  jobId: z.string().min(1),
  status: z.literal("queued"),
});

export type AuditExportQueuedResponse = z.infer<
  typeof auditExportQueuedResponseSchema
>;

export const auditExportJobStatusSchema = z.enum([
  "queued",
  "processing",
  "completed",
  "failed",
]);

export type AuditExportJobStatus = z.infer<typeof auditExportJobStatusSchema>;

export const auditExportJobResponseSchema = z.object({
  exportJobId: z.string().uuid(),
  merchantId: z.string().uuid(),
  status: auditExportJobStatusSchema,
  format: z.enum(["csv"]),
  createdAt: z.string().datetime(),
  startedAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
  downloadUrl: z.string().nullable().optional(),
  errorMessage: z.string().nullable().optional(),
});

export type AuditExportJobResponse = z.infer<
  typeof auditExportJobResponseSchema
>;
