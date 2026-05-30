import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { orders } from "./orders.js";
import { products } from "./products.js";

export const orderLines = pgTable("order_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull(),
  productName: text("product_name").notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type OrderLine = typeof orderLines.$inferSelect;
export type NewOrderLine = typeof orderLines.$inferInsert;
