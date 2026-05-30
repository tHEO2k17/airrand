import { z } from "zod";

export const productStockStateSchema = z.enum([
  "in_stock",
  "low_stock",
  "out_of_stock",
]);

export type ProductStockState = z.infer<typeof productStockStateSchema>;

export const productCategorySummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  iconKey: z.string().nullable(),
  isActive: z.boolean(),
});

export type ProductCategorySummary = z.infer<typeof productCategorySummarySchema>;

export const productCategoryResponseSchema = z.object({
  id: z.string().uuid(),
  merchantId: z.string().uuid(),
  name: z.string(),
  iconKey: z.string().nullable(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ProductCategoryResponse = z.infer<typeof productCategoryResponseSchema>;

export const createProductCategorySchema = z.object({
  name: z.string().trim().min(1).max(120),
  iconKey: z.string().trim().max(64).nullable().optional(),
  sortOrder: z.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export type CreateProductCategoryInput = z.infer<typeof createProductCategorySchema>;

export const updateProductCategorySchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    iconKey: z.string().trim().max(64).nullable().optional(),
    sortOrder: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export type UpdateProductCategoryInput = z.infer<typeof updateProductCategorySchema>;
