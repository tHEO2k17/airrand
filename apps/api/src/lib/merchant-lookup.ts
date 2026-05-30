import {
  merchantsRepository,
} from "../repositories/merchants.repository.js";

export async function findMerchantById(merchantId: string) {
  return merchantsRepository.findById(merchantId);
}

export async function findMerchantBySlug(slugInput: string) {
  return merchantsRepository.findBySlug(slugInput);
}
