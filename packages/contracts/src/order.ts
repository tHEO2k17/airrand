import { z } from "zod";
import { orderStatusSchema } from "./order-status.js";
import { productResponseSchema } from "./product.js";

const orderLineInputSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
});

export const createOrderSchema = z.object({
  lines: z.array(orderLineInputSchema).min(1).max(50),
  customerName: z.string().trim().min(1).max(200).optional(),
  customerContact: z.string().trim().min(1).max(200).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderStatusSchema = z.object({
  status: orderStatusSchema,
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

export const orderLineResponseSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number().int(),
  productName: z.string(),
  unitPriceCents: z.number().int(),
});

export type OrderLineResponse = z.infer<typeof orderLineResponseSchema>;

export const orderResponseSchema = z.object({
  id: z.string().uuid(),
  reference: z.string().min(1),
  merchantId: z.string().uuid(),
  status: orderStatusSchema,
  customerName: z.string().nullable(),
  customerContact: z.string().nullable(),
  notes: z.string().nullable(),
  pickedUpAt: z.string().datetime().nullable().optional(),
  lines: z.array(orderLineResponseSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type OrderResponse = z.infer<typeof orderResponseSchema>;

export const listProductsResponseSchema = z.object({
  products: z.array(productResponseSchema),
});

export const listOrdersResponseSchema = z.object({
  orders: z.array(orderResponseSchema),
});

export const listOrdersQuerySchema = z.object({
  reference: z.string().trim().min(1).max(32).optional(),
});

export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
