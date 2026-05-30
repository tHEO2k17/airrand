import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { merchants } from "./merchants.js";

export const notificationJobStatusEnum = pgEnum("notification_job_status", [
  "queued",
  "processing",
  "sent",
  "failed",
]);

export type NotificationJobStatus =
  (typeof notificationJobStatusEnum.enumValues)[number];

export const notificationChannelEnum = pgEnum("notification_channel", [
  "sms_placeholder",
  "email_placeholder",
  "internal",
]);

export type NotificationChannel =
  (typeof notificationChannelEnum.enumValues)[number];

export const notificationTypeEnum = pgEnum("notification_type", [
  "order_ready_for_pickup",
  "audit_export_completed",
  "staff_password_reset",
]);

export type NotificationType =
  (typeof notificationTypeEnum.enumValues)[number];

export const notificationJobs = pgTable("notification_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  merchantId: uuid("merchant_id").references(() => merchants.id, {
    onDelete: "cascade",
  }),
  type: notificationTypeEnum("type").notNull(),
  channel: notificationChannelEnum("channel").notNull(),
  recipient: text("recipient").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  status: notificationJobStatusEnum("status").notNull().default("queued"),
  bullJobId: text("bull_job_id"),
  providerMessageId: text("provider_message_id"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
});

export type NotificationJob = typeof notificationJobs.$inferSelect;
export type NewNotificationJob = typeof notificationJobs.$inferInsert;
