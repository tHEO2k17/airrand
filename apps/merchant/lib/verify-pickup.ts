import { ApiError, verifyPickup } from "./api";
import { decodePickupTokenForRouting } from "./decode-pickup-token";

export interface VerifyPickupSuccess {
  orderId: string;
  reference: string;
  status: string;
  verifiedAt: string;
}

export type VerifyPickupResult =
  | { ok: true; data: VerifyPickupSuccess }
  | { ok: false; message: string };

export async function verifyPickupToken(
  merchantId: string,
  rawToken: string,
): Promise<VerifyPickupResult> {
  const trimmed = rawToken.trim();
  if (!trimmed) {
    return { ok: false, message: "Pickup token is empty." };
  }

  const routing = decodePickupTokenForRouting(trimmed);
  if (!routing) {
    return {
      ok: false,
      message: "Token format is invalid. Check the value and try again.",
    };
  }

  if (routing.merchantId !== merchantId) {
    return { ok: false, message: "This token belongs to a different merchant." };
  }

  try {
    const result = await verifyPickup(merchantId, routing.orderId, trimmed);
    return {
      ok: true,
      data: {
        orderId: result.order.id,
        reference: result.order.reference,
        status: result.order.status,
        verifiedAt: result.verifiedAt,
      },
    };
  } catch (err) {
    if (err instanceof ApiError) {
      return { ok: false, message: `${err.code}: ${err.message}` };
    }
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Verification failed",
    };
  }
}
