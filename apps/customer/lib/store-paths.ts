import { normalizeOrderReferenceQuery } from "@airrand/domain";
import { normalizeStoreSlug } from "./store-slug";

export function buildStorePath(merchantSlug: string): string {
  return `/store/${normalizeStoreSlug(merchantSlug)}`;
}

export function buildStoreCartPath(merchantSlug: string): string {
  return `${buildStorePath(merchantSlug)}/cart`;
}

export function buildStoreConfirmationPath(merchantSlug: string): string {
  return `${buildStorePath(merchantSlug)}/order-confirmation`;
}

export function buildStoreTrackingPath(
  merchantSlug: string,
  reference: string,
): string {
  const normalizedReference = normalizeOrderReferenceQuery(reference);
  return `${buildStorePath(merchantSlug)}/track/${encodeURIComponent(normalizedReference)}`;
}

export function buildStoreTrackingUrl(
  merchantSlug: string,
  reference: string,
  origin = "",
): string {
  const path = buildStoreTrackingPath(merchantSlug, reference);
  if (!origin) {
    return path;
  }
  return `${origin.replace(/\/$/u, "")}${path}`;
}

export function parseStoreTrackingReference(referenceParam: string): string {
  return normalizeOrderReferenceQuery(decodeURIComponent(referenceParam));
}
