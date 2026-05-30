import type { Product, ProductCategory } from "@airrand/database";
import { productCategories, products, type Database } from "@airrand/database";
import { and, asc, eq, isNull, ne, or, type SQL } from "drizzle-orm";
import { db } from "../lib/db.js";

export type ProductWithCategory = {
  product: Product;
  category: ProductCategory | null;
};

export type ProductsRepository = {
  listWithCategories: (
    merchantId: string,
    availableOnly: boolean,
  ) => Promise<ProductWithCategory[]>;
};

export function buildMerchantProductConditions(
  merchantId: string,
  availableOnly: boolean,
): SQL[] {
  const conditions: SQL[] = [eq(products.merchantId, merchantId)];

  if (availableOnly) {
    conditions.push(eq(products.isAvailable, true));
    conditions.push(ne(products.stockState, "out_of_stock"));
    conditions.push(
      or(isNull(products.categoryId), eq(productCategories.isActive, true))!,
    );
  }

  return conditions;
}

export function createProductsRepository(database: Database = db): ProductsRepository {
  return {
    async listWithCategories(merchantId: string, availableOnly: boolean) {
      const conditions = buildMerchantProductConditions(
        merchantId,
        availableOnly,
      );
      return database
        .select({
          product: products,
          category: productCategories,
        })
        .from(products)
        .leftJoin(
          productCategories,
          eq(products.categoryId, productCategories.id),
        )
        .where(and(...conditions))
        .orderBy(asc(products.name));
    },
  };
}

export const productsRepository = createProductsRepository();

export async function listWithCategories(
  merchantId: string,
  availableOnly: boolean,
): Promise<ProductWithCategory[]> {
  return productsRepository.listWithCategories(merchantId, availableOnly);
}
