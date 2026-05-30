import { pgEnum } from "drizzle-orm/pg-core";

export const orderStatusEnum = pgEnum("order_status", [
  "placed",
  "accepted",
  "ready",
  "picked_up",
  "cancelled",
]);

export const ORDER_STATUSES = orderStatusEnum.enumValues;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
