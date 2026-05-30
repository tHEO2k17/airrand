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
import type { ListMerchantProductsQuery } from "./list-merchant-products.query.js";

export type ListMerchantProductsResult =
  | { kind: "merchant_not_found" }
  | { kind: "validation_error"; message: string }
  | { kind: "ok"; products: ProductResponse[] };

export type ListMerchantProductsDeps = {
  merchantsRepository: MerchantsRepository;
  productsRepository: ProductsRepository;
};

export async function listMerchantProductsHandler(
  input: ListMerchantProductsQuery,
  deps: ListMerchantProductsDeps = {
    merchantsRepository,
    productsRepository,
  },
): Promise<ListMerchantProductsResult> {
  const merchant = await deps.merchantsRepository.findById(input.merchantId);
  if (!merchant) {
    return { kind: "merchant_not_found" };
  }

  const parsed = listProductsQuerySchema.safeParse(input.query);
  if (!parsed.success) {
    return { kind: "validation_error", message: parsed.error.message };
  }

  const rows = await deps.productsRepository.listWithCategories(
    input.merchantId,
    parsed.data.availableOnly ?? false,
  );

  return {
    kind: "ok",
    products: rows.map(({ product, category }) =>
      toProductResponse(product, category),
    ),
  };
}
