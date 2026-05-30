import { isProductCustomerCatalogVisible } from "@airrand/domain";
import type { ProductCategory, Product } from "@airrand/database";
import { productCategories } from "@airrand/database";
import { and, eq } from "drizzle-orm";
import { db } from "./db.js";

export {
  buildMerchantProductConditions,
  type ProductWithCategory,
} from "../repositories/products.repository.js";

export { listWithCategories as listProductsWithCategories } from "../repositories/products.repository.js";

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
    return { ok: false, message: `Product "${product.name}" is not orderable` };
  }

  return { ok: true };
}
