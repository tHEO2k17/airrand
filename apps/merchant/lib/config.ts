/** Slug of the seeded demo merchant (see packages/database seed). */
export const DEMO_MERCHANT_SLUG = "demo-cafe";

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3003";
}

export function getCustomerAppOrigin(): string {
  return process.env.NEXT_PUBLIC_CUSTOMER_APP_ORIGIN ?? "http://localhost:3002";
}
