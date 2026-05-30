export const DEMO_MERCHANT_SLUG = "demo-cafe";

export const CART_STORAGE_KEY = "airrand_customer_cart";

export const ORDER_CONFIRMATION_STORAGE_KEY = "airrand_order_confirmation";

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3003";
}
