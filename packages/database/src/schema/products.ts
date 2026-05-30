import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { merchants } from "./merchants.js";

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  merchantId: uuid("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  /** Catalog list price in minor units (display only; not processed by the platform). */
  unitPriceCents: integer("unit_price_cents").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
