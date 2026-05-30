import { ORDER_CONFIRMATION_STORAGE_KEY } from "./config";

export interface StoredOrderConfirmation {
  orderId: string;
  merchantId: string;
  status: string;
  token: string;
  expiresAt: string;
}

export function saveOrderConfirmation(data: StoredOrderConfirmation): void {
  sessionStorage.setItem(ORDER_CONFIRMATION_STORAGE_KEY, JSON.stringify(data));
}

export function readOrderConfirmation(): StoredOrderConfirmation | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(ORDER_CONFIRMATION_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as StoredOrderConfirmation;
    if (
      typeof parsed.orderId !== "string" ||
      typeof parsed.merchantId !== "string" ||
      typeof parsed.status !== "string" ||
      typeof parsed.token !== "string" ||
      typeof parsed.expiresAt !== "string"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
