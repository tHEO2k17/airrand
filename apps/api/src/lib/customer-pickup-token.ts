import type { Order } from "@airrand/database";
import { createPickupToken, PICKUP_TOKEN_TTL_MS } from "@airrand/qr";
import { getQrSigningSecret } from "./qr.js";

const PICKUP_TOKEN_STATUSES = new Set(["accepted", "ready"]);

export function issueCustomerPickupToken(
  order: Order,
  merchantId: string,
): string | null {
  if (!PICKUP_TOKEN_STATUSES.has(order.status)) {
    return null;
  }

  if (!order.pickupTokenNonce || !order.pickupTokenExpiresAt) {
    return null;
  }

  const expiresAt = order.pickupTokenExpiresAt.getTime();
  if (expiresAt <= Date.now()) {
    return null;
  }

  const issuedAt = expiresAt - PICKUP_TOKEN_TTL_MS;
  const { token } = createPickupToken({
    orderId: order.id,
    merchantId,
    secret: getQrSigningSecret(),
    nonce: order.pickupTokenNonce,
    issuedAt,
    expiresAt,
  });

  return token;
}
