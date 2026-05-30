import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { merchants } from "./merchants.js";

export const merchantUsers = pgTable("merchant_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  merchantId: uuid("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  displayName: text("display_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type MerchantUser = typeof merchantUsers.$inferSelect;
export type NewMerchantUser = typeof merchantUsers.$inferInsert;
