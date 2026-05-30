import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { merchants } from "./merchants.js";
import { orders } from "./orders.js";

export const auditActorTypeEnum = pgEnum("audit_actor_type", [
  "system",
  "merchant_staff",
  "customer",
  "unknown",
]);

export type AuditActorType = (typeof auditActorTypeEnum.enumValues)[number];

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  merchantId: uuid("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
  actorType: auditActorTypeEnum("actor_type").notNull().default("unknown"),
  actorLabel: text("actor_label"),
  action: text("action").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
