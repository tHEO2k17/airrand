import { listProductsQuerySchema, type ProductResponse } from "@airrand/contracts";
import { toProductResponse } from "../../lib/mappers.js";
import {
  merchantsRepository,
  type MerchantsRepository,
} from "../../repositories/merchants.repository.js";
import {
  productsRepository,
  type ProductsRepository,
} from "../../repositories/products.repository.js";
import type { ListPublicProductsBySlugQuery } from "./list-public-products-by-slug.query.js";

export type ListPublicProductsBySlugResult =
  | { kind: "not_found" }
  | { kind: "validation_error"; message: string }
  | { kind: "ok"; products: ProductResponse[] };

export type ListPublicProductsBySlugDeps = {
  merchantsRepository: MerchantsRepository;
  productsRepository: ProductsRepository;
};

export async function listPublicProductsBySlugHandler(
  input: ListPublicProductsBySlugQuery,
  deps: ListPublicProductsBySlugDeps = {
    merchantsRepository,
    productsRepository,
  },
): Promise<ListPublicProductsBySlugResult> {
  const merchant = await deps.merchantsRepository.findBySlug(input.slug);
  if (!merchant) {
    return { kind: "not_found" };
  }

  const query = listProductsQuerySchema.safeParse(input.query);
  if (!query.success) {
    return { kind: "validation_error", message: query.error.message };
  }

  const rows = await deps.productsRepository.listWithCategories(
    merchant.id,
    query.data.availableOnly ?? false,
  );

  return {
    kind: "ok",
    products: rows.map(({ product, category }) =>
      toProductResponse(product, category),
    ),
  };
}
