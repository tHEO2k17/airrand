export const PICKUP_QR_LOCKED_MESSAGE =
  "Your pickup code will appear when the merchant marks this order as ready.";

/** Active scannable QR — ready for counter pickup only. */
export function shouldShowPickupQr(status: string): boolean {
  return status === "ready";
}

/** Locked placeholder while the shop prepares the order. */
export function shouldShowPickupQrLocked(status: string): boolean {
  return status === "accepted";
}
