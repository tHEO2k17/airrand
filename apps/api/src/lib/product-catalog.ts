import { isProductCustomerCatalogVisible } from "@airrand/domain";
import type { ProductCategory, Product } from "@airrand/database";
import { productCategories, products } from "@airrand/database";
import { and, asc, eq, ne, or, isNull, type SQL } from "drizzle-orm";
import { db } from "./db.js";

export type ProductWithCategory = {
  product: Product;
  category: ProductCategory | null;
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
      or(
        isNull(products.categoryId),
        eq(productCategories.isActive, true),
      )!,
    );
  }

  return conditions;
}

export async function listProductsWithCategories(
  merchantId: string,
  availableOnly: boolean,
): Promise<ProductWithCategory[]> {
  const conditions = buildMerchantProductConditions(merchantId, availableOnly);
  return db
    .select({
      product: products,
      category: productCategories,
    })
    .from(products)
    .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
    .where(and(...conditions))
    .orderBy(asc(products.name));
}

export async function findMerchantCategory(
  merchantId: string,
  categoryId: string,
): Promise<ProductCategory | null> {
  const [row] = await db
    .select()
    .from(productCategories)
    .where(
      and(
        eq(productCategories.id, categoryId),
        eq(productCategories.merchantId, merchantId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export function assertProductOrderable(
  product: Product,
  category: ProductCategory | null,
): { ok: true } | { ok: false; message: string } {
  if (!isProductCustomerCatalogVisible(product, category ?? undefined)) {
    if (product.stockState === "out_of_stock") {
      return { ok: false, message: `Product "${product.name}" is out of stock` };
    }
    if (!product.isAvailable) {
      return { ok: false, message: `Product "${product.name}" is not available` };
    }
    if (category && !category.isActive) {
      return {
        ok: false,
        message: `Product "${product.name}" is in an inactive category`,
      };
    }
    return { ok: false, message: `Product "${product.name}" is not available` };
  }
  return { ok: true };
}
