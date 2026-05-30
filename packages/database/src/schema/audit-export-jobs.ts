import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { merchants } from "./merchants.js";
import { merchantUsers } from "./merchant-users.js";

export const auditExportJobStatusEnum = pgEnum("audit_export_job_status", [
  "queued",
  "processing",
  "completed",
  "failed",
]);

export type AuditExportJobStatus =
  (typeof auditExportJobStatusEnum.enumValues)[number];

export const auditExportFormatEnum = pgEnum("audit_export_format", ["csv"]);

export type AuditExportFormat =
  (typeof auditExportFormatEnum.enumValues)[number];

export const auditExportJobs = pgTable("audit_export_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  merchantId: uuid("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  requestedByMerchantUserId: uuid("requested_by_merchant_user_id")
    .notNull()
    .references(() => merchantUsers.id),
  bullJobId: text("bull_job_id"),
  status: auditExportJobStatusEnum("status").notNull().default("queued"),
  format: auditExportFormatEnum("format").notNull().default("csv"),
  filePath: text("file_path"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export type AuditExportJob = typeof auditExportJobs.$inferSelect;
export type NewAuditExportJob = typeof auditExportJobs.$inferInsert;
