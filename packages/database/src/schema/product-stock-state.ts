import { pgEnum } from "drizzle-orm/pg-core";

export const productStockStateEnum = pgEnum("product_stock_state", [
  "in_stock",
  "low_stock",
  "out_of_stock",
]);

export const PRODUCT_STOCK_STATES = productStockStateEnum.enumValues;
export type ProductStockState = (typeof PRODUCT_STOCK_STATES)[number];
