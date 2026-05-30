import { normalizeMerchantSlug } from "@airrand/domain";

export function normalizeStoreSlug(slug: string): string {
  return normalizeMerchantSlug(slug);
}
