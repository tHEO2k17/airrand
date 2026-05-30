const MERCHANT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Normalizes URL path and lookup input for merchant slugs. */
export function normalizeMerchantSlug(input: string): string {
  return input.trim().toLowerCase();
}

export function isValidMerchantSlug(slug: string): boolean {
  const normalized = normalizeMerchantSlug(slug);
  return normalized.length > 0 && MERCHANT_SLUG_PATTERN.test(normalized);
}
