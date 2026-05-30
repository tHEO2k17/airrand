import type { MerchantResponse } from "@airrand/contracts";
import { toMerchantResponse } from "../../lib/mappers.js";
import {
  merchantsRepository,
  type MerchantsRepository,
} from "../../repositories/merchants.repository.js";
import type { GetMerchantBySlugQuery } from "./get-merchant-by-slug.query.js";

export type GetMerchantBySlugResult =
  | { kind: "ok"; merchant: MerchantResponse }
  | { kind: "not_found" };

export type GetMerchantBySlugDeps = {
  merchantsRepository: MerchantsRepository;
};

export async function getMerchantBySlugHandler(
  query: GetMerchantBySlugQuery,
  deps: GetMerchantBySlugDeps = { merchantsRepository },
): Promise<GetMerchantBySlugResult> {
  const merchant = await deps.merchantsRepository.findBySlug(query.slug);
  if (!merchant) {
    return { kind: "not_found" };
  }

  return { kind: "ok", merchant: toMerchantResponse(merchant) };
}
