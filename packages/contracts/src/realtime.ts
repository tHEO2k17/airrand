import { z } from "zod";
import { customerOrderStatusResponseSchema } from "./customer-order-status.js";
import { orderResponseSchema } from "./order.js";
import { productResponseSchema } from "./product.js";

export const realtimeEventTypeSchema = z.enum([
  "order.created",
  "order.status_changed",
  "order.pickup_verified",
  "product.created",
  "product.updated",
]);

export type RealtimeEventType = z.infer<typeof realtimeEventTypeSchema>;

export const realtimeEventEnvelopeSchema = z.object({
  id: z.string().uuid(),
  type: realtimeEventTypeSchema,
  merchantId: z.string().uuid(),
  orderId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  timestamp: z.string().datetime(),
  data: z.unknown(),
});

export type RealtimeEventEnvelope = z.infer<typeof realtimeEventEnvelopeSchema>;

export const merchantRealtimeEventSchema = realtimeEventEnvelopeSchema.extend({
  data: z.union([
    z.object({ order: orderResponseSchema }),
    z.object({ product: productResponseSchema }),
    z.object({
      order: orderResponseSchema,
      verifiedAt: z.string().datetime(),
    }),
  ]),
});

export const orderRealtimeEventSchema = realtimeEventEnvelopeSchema.extend({
  data: z.object({ status: customerOrderStatusResponseSchema }),
});
