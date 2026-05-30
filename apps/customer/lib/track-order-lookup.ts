import { isValidOrderReference, normalizeOrderReferenceQuery } from "@airrand/domain";
import { buildStoreTrackingPath } from "./store-paths";
import { normalizeStoreSlug } from "./store-slug";

export type TrackOrderLookupResult =
  | { ok: true; path: string }
  | { ok: false; message: string };

export function resolveTrackOrderLookup(
  merchantSlugInput: string,
  referenceInput: string,
): TrackOrderLookupResult {
  const merchantSlug = normalizeStoreSlug(merchantSlugInput);
  if (!merchantSlug) {
    return {
      ok: false,
      message: "Enter the shop link name from your order link (e.g. kofi-mart).",
    };
  }

  const trimmedReference = referenceInput.trim();
  if (!trimmedReference) {
    return { ok: false, message: "Enter your order reference (e.g. ORD-1022 or 1022)." };
  }

  const reference = normalizeOrderReferenceQuery(trimmedReference);
  if (!isValidOrderReference(reference)) {
    return {
      ok: false,
      message: "Order reference looks invalid. Try ORD-1022 or the number from your receipt.",
    };
  }

  return {
    ok: true,
    path: buildStoreTrackingPath(merchantSlug, reference),
  };
}
