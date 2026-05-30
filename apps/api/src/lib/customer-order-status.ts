import type { CustomerOrderStatusResponse } from "@airrand/contracts";
import type { Merchant, Order, OrderLine } from "@airrand/database";
import { issueCustomerPickupToken } from "./customer-pickup-token.js";

export function toCustomerOrderStatusResponse(
  order: Order,
  lines: OrderLine[],
  merchant: Merchant,
): CustomerOrderStatusResponse {
  return {
    id: order.id,
    reference: order.reference,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    pickedUpAt: order.pickedUpAt?.toISOString() ?? null,
    pickupTokenExpiresAt: order.pickupTokenExpiresAt?.toISOString() ?? null,
    pickupToken: issueCustomerPickupToken(order, merchant.id),
    lines: lines.map((line) => ({
      productName: line.productName,
      quantity: line.quantity,
    })),
    merchant: {
      id: merchant.id,
      name: merchant.name,
      slug: merchant.slug,
    },
  };
}

const FORBIDDEN_CUSTOMER_STATUS_KEYS = [
  "customerName",
  "customerContact",
  "notes",
  "pickupTokenNonce",
  "unitPriceCents",
  "productId",
  "passwordHash",
  "email",
] as const;

export function assertCustomerSafeOrderStatusPayload(
  payload: Record<string, unknown>,
): void {
  for (const key of FORBIDDEN_CUSTOMER_STATUS_KEYS) {
    if (key in payload) {
      throw new Error(`Customer status payload must not include ${key}`);
    }
  }
}
