import { getCustomerAppOrigin } from "./config";

export function getMerchantStorefrontPath(slug: string): string {
  return `/store/${slug.trim().toLowerCase()}`;
}

export function getMerchantStorefrontUrl(slug: string): string {
  const path = getMerchantStorefrontPath(slug);
  return `${getCustomerAppOrigin()}${path}`;
}
