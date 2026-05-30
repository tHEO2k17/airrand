import {
  getOrderConfirmationStorageKey,
  LEGACY_ORDER_CONFIRMATION_STORAGE_KEY,
} from "./config";
import { normalizeStoreSlug } from "./store-slug";

export interface StoredOrderConfirmation {
  orderId: string;
  reference: string;
  merchantId: string;
  merchantSlug: string;
  status: string;
  token: string;
  expiresAt: string;
}

function parseStoredOrderConfirmation(
  raw: string,
): StoredOrderConfirmation | null {
  try {
    const parsed = JSON.parse(raw) as StoredOrderConfirmation;
    if (
      typeof parsed.orderId !== "string" ||
      typeof parsed.reference !== "string" ||
      typeof parsed.merchantId !== "string" ||
      typeof parsed.status !== "string" ||
      typeof parsed.token !== "string" ||
      typeof parsed.expiresAt !== "string"
    ) {
      return null;
    }

    return {
      ...parsed,
      merchantSlug:
        typeof parsed.merchantSlug === "string"
          ? normalizeStoreSlug(parsed.merchantSlug)
          : "",
    };
  } catch {
    return null;
  }
}

export function saveOrderConfirmation(
  merchantSlug: string,
  data: StoredOrderConfirmation,
): void {
  sessionStorage.setItem(
    getOrderConfirmationStorageKey(merchantSlug),
    JSON.stringify({
      ...data,
      merchantSlug: normalizeStoreSlug(data.merchantSlug || merchantSlug),
    }),
  );
}

export function readOrderConfirmation(
  merchantSlug: string,
): StoredOrderConfirmation | null {
  if (typeof window === "undefined") {
    return null;
  }

  const scoped = sessionStorage.getItem(
    getOrderConfirmationStorageKey(merchantSlug),
  );
  if (scoped) {
    const parsed = parseStoredOrderConfirmation(scoped);
    if (parsed) {
      return parsed;
    }
  }

  const legacy = sessionStorage.getItem(LEGACY_ORDER_CONFIRMATION_STORAGE_KEY);
  if (!legacy) {
    return null;
  }

  const parsed = parseStoredOrderConfirmation(legacy);
  if (!parsed) {
    return null;
  }

  if (
    parsed.merchantSlug &&
    normalizeStoreSlug(parsed.merchantSlug) !== normalizeStoreSlug(merchantSlug)
  ) {
    return null;
  }

  return parsed;
}

export function readLatestOrderConfirmation(): StoredOrderConfirmation | null {
  if (typeof window === "undefined") {
    return null;
  }

  const legacy = sessionStorage.getItem(LEGACY_ORDER_CONFIRMATION_STORAGE_KEY);
  if (legacy) {
    const parsed = parseStoredOrderConfirmation(legacy);
    if (parsed) {
      return parsed;
    }
  }

  for (let index = 0; index < sessionStorage.length; index += 1) {
    const key = sessionStorage.key(index);
    if (!key?.startsWith("airrand_order_confirmation:")) {
      continue;
    }
    const raw = sessionStorage.getItem(key);
    if (!raw) {
      continue;
    }
    const parsed = parseStoredOrderConfirmation(raw);
    if (parsed?.merchantSlug) {
      return parsed;
    }
  }

  return null;
}
