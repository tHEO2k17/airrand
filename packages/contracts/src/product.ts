import { z } from "zod";
import {
  productCategorySummarySchema,
  productStockStateSchema,
} from "./category.js";

export { productStockStateSchema, type ProductStockState } from "./category.js";
export { productCategorySummarySchema, type ProductCategorySummary } from "./category.js";

export const createProductSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  unitPriceCents: z.number().int().min(0),
  isAvailable: z.boolean().optional().default(true),
  categoryId: z.string().uuid().nullable().optional(),
  stockState: productStockStateSchema.optional().default("in_stock"),
  stockQuantity: z.number().int().min(0).nullable().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    unitPriceCents: z.number().int().min(0).optional(),
    isAvailable: z.boolean().optional(),
    categoryId: z.string().uuid().nullable().optional(),
    stockState: productStockStateSchema.optional(),
    stockQuantity: z.number().int().min(0).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const listProductsQuerySchema = z.object({
  availableOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;

export const productResponseSchema = z.object({
  id: z.string().uuid(),
  merchantId: z.string().uuid(),
  categoryId: z.string().uuid().nullable(),
  category: productCategorySummarySchema.nullable(),
  name: z.string(),
  description: z.string().nullable(),
  unitPriceCents: z.number().int(),
  isAvailable: z.boolean(),
  stockState: productStockStateSchema,
  stockQuantity: z.number().int().min(0).nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ProductResponse = z.infer<typeof productResponseSchema>;
