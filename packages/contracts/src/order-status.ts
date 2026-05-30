import { z } from "zod";

export const ORDER_STATUSES = [
  "placed",
  "accepted",
  "ready",
  "picked_up",
  "cancelled",
] as const;

export const orderStatusSchema = z.enum(ORDER_STATUSES);

export type OrderStatus = z.infer<typeof orderStatusSchema>;
