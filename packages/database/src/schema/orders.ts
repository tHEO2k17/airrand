import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { orderStatusEnum } from "./enums.js";
import { merchants } from "./merchants.js";

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  reference: text("reference").notNull().unique(),
  merchantId: uuid("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  status: orderStatusEnum("status").notNull().default("placed"),
  customerName: text("customer_name"),
  customerContact: text("customer_contact"),
  notes: text("notes"),
  pickupTokenNonce: text("pickup_token_nonce"),
  pickupTokenExpiresAt: timestamp("pickup_token_expires_at", {
    withTimezone: true,
  }),
  pickedUpAt: timestamp("picked_up_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
