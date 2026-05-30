/** Legacy unscoped cart key (pre–store routing). */
export const LEGACY_CART_STORAGE_KEY = "airrand_customer_cart";

/** Legacy unscoped confirmation key (pre–store routing). */
export const LEGACY_ORDER_CONFIRMATION_STORAGE_KEY = "airrand_order_confirmation";

export function getCartStorageKey(merchantSlug: string): string {
  return `airrand_customer_cart:${normalizeStorageSlug(merchantSlug)}`;
}

export function getOrderConfirmationStorageKey(merchantSlug: string): string {
  return `airrand_order_confirmation:${normalizeStorageSlug(merchantSlug)}`;
}

function normalizeStorageSlug(merchantSlug: string): string {
  return merchantSlug.trim().toLowerCase();
}

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3003";
}
