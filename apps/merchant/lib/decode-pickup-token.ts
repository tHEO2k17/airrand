/**
 * Decode pickup token payload for routing only (orderId extraction).
 * Does NOT verify signature — server verification is required.
 */
export interface PickupTokenRoutingPayload {
  orderId: string;
  merchantId: string;
}

function base64UrlDecode(value: string): string {
  let base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  if (pad) {
    base64 += "=".repeat(4 - pad);
  }
  return atob(base64);
}

export function decodePickupTokenForRouting(
  token: string,
): PickupTokenRoutingPayload | null {
  const trimmed = token.trim();
  const parts = trimmed.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const payloadBase64 = parts[0];
  if (!payloadBase64) {
    return null;
  }

  try {
    const json = base64UrlDecode(payloadBase64);
    const payload = JSON.parse(json) as Record<string, unknown>;

    if (
      typeof payload.orderId !== "string" ||
      typeof payload.merchantId !== "string"
    ) {
      return null;
    }

    return {
      orderId: payload.orderId,
      merchantId: payload.merchantId,
    };
  } catch {
    return null;
  }
}
