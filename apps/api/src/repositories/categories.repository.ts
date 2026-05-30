import {
  productCategories,
  type Database,
  type ProductCategory,
} from "@airrand/database";
import { asc, eq } from "drizzle-orm";
import { db } from "../lib/db.js";

export type CategoriesRepository = {
  listByMerchantId: (merchantId: string) => Promise<ProductCategory[]>;
};

export function createCategoriesRepository(
  database: Database = db,
): CategoriesRepository {
  return {
    async listByMerchantId(merchantId: string) {
      return database
        .select()
        .from(productCategories)
        .where(eq(productCategories.merchantId, merchantId))
        .orderBy(asc(productCategories.sortOrder), asc(productCategories.name));
    },
  };
}

export const categoriesRepository = createCategoriesRepository();
