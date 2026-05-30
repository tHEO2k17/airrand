import type { ProductCategoryResponse } from "@airrand/contracts";
import { toProductCategoryResponse } from "../../lib/mappers.js";
import {
  categoriesRepository,
  type CategoriesRepository,
} from "../../repositories/categories.repository.js";
import {
  merchantsRepository,
  type MerchantsRepository,
} from "../../repositories/merchants.repository.js";
import type { ListMerchantCategoriesQuery } from "./list-merchant-categories.query.js";

export type ListMerchantCategoriesResult =
  | { kind: "merchant_not_found" }
  | { kind: "ok"; categories: ProductCategoryResponse[] };

export type ListMerchantCategoriesDeps = {
  merchantsRepository: MerchantsRepository;
  categoriesRepository: CategoriesRepository;
};

export async function listMerchantCategoriesHandler(
  query: ListMerchantCategoriesQuery,
  deps: ListMerchantCategoriesDeps = {
    merchantsRepository,
    categoriesRepository,
  },
): Promise<ListMerchantCategoriesResult> {
  const merchant = await deps.merchantsRepository.findById(query.merchantId);
  if (!merchant) {
    return { kind: "merchant_not_found" };
  }

  const rows = await deps.categoriesRepository.listByMerchantId(query.merchantId);
  return { kind: "ok", categories: rows.map(toProductCategoryResponse) };
}
