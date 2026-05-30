import type { MerchantResponse } from "@airrand/contracts";
import { toMerchantResponse } from "../../lib/mappers.js";
import {
  merchantsRepository,
  type MerchantsRepository,
} from "../../repositories/merchants.repository.js";

export type ListMerchantsResult = {
  merchants: MerchantResponse[];
};

export type ListMerchantsDeps = {
  merchantsRepository: MerchantsRepository;
};

export async function listMerchantsHandler(
  deps: ListMerchantsDeps = { merchantsRepository },
): Promise<ListMerchantsResult> {
  const rows = await deps.merchantsRepository.listOrderedByName();
  return { merchants: rows.map(toMerchantResponse) };
}
