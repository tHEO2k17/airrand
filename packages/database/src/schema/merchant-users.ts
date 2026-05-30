import { boolean, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { merchants } from "./merchants.js";
import { merchantUserRoleEnum } from "./merchant-user-role.js";

export const merchantUsers = pgTable(
  "merchant_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    merchantId: uuid("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    displayName: text("display_name"),
    passwordHash: text("password_hash"),
    role: merchantUserRoleEnum("role").notNull().default("staff"),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("merchant_users_email_unique").on(table.email)],
);

export type MerchantUser = typeof merchantUsers.$inferSelect;
export type NewMerchantUser = typeof merchantUsers.$inferInsert;
