import type {
  Merchant,
  Order,
  OrderLine,
  Product,
  ProductCategory,
} from "@airrand/database";
import { toCustomerOrderStatusResponse } from "../customer-order-status.js";
import { toOrderResponse, toProductResponse } from "../mappers.js";
import { merchantRealtimeChannel, orderRealtimeChannel } from "./channels.js";
import { buildRealtimeEvent, publishRealtimeEvent } from "./event-bus.js";
import { sanitizeRealtimePayload } from "./sanitize.js";
import type { RealtimeEventType } from "@airrand/contracts";

async function publishMerchantEvent(
  merchantId: string,
  type: RealtimeEventType,
  data: unknown,
  ids?: { orderId?: string; productId?: string },
): Promise<void> {
  const message = buildRealtimeEvent({
    type,
    merchantId,
    orderId: ids?.orderId,
    productId: ids?.productId,
    data: sanitizeRealtimePayload(data),
  });

  await publishRealtimeEvent(merchantRealtimeChannel(merchantId), message);
}

async function publishOrderCustomerEvent(
  merchantId: string,
  orderId: string,
  type: RealtimeEventType,
  merchant: Merchant,
  order: Order,
  lines: OrderLine[],
  extra?: Record<string, unknown>,
): Promise<void> {
  const status = toCustomerOrderStatusResponse(order, lines, merchant);
  const message = buildRealtimeEvent({
    type,
    merchantId,
    orderId,
    data: sanitizeRealtimePayload({ status, ...extra }),
  });

  await publishRealtimeEvent(orderRealtimeChannel(merchantId, orderId), message);
}

export async function publishOrderCreatedRealtime(
  merchant: Merchant,
  order: Order,
  lines: OrderLine[],
): Promise<void> {
  const orderPayload = toOrderResponse(order, lines);

  await publishMerchantEvent(merchant.id, "order.created", { order: orderPayload }, {
    orderId: order.id,
  });
  await publishOrderCustomerEvent(
    merchant.id,
    order.id,
    "order.created",
    merchant,
    order,
    lines,
  );
}

export async function publishOrderStatusChangedRealtime(
  merchant: Merchant,
  order: Order,
  lines: OrderLine[],
): Promise<void> {
  const orderPayload = toOrderResponse(order, lines);

  await publishMerchantEvent(
    merchant.id,
    "order.status_changed",
    { order: orderPayload },
    { orderId: order.id },
  );
  await publishOrderCustomerEvent(
    merchant.id,
    order.id,
    "order.status_changed",
    merchant,
    order,
    lines,
  );
}

export async function publishOrderPickupVerifiedRealtime(
  merchant: Merchant,
  order: Order,
  lines: OrderLine[],
  verifiedAt: string,
): Promise<void> {
  const orderPayload = toOrderResponse(order, lines);

  await publishMerchantEvent(
    merchant.id,
    "order.pickup_verified",
    { order: orderPayload, verifiedAt },
    { orderId: order.id },
  );
  await publishOrderCustomerEvent(
    merchant.id,
    order.id,
    "order.pickup_verified",
    merchant,
    order,
    lines,
    { verifiedAt },
  );
}

export async function publishProductCreatedRealtime(
  merchantId: string,
  product: Product,
  category?: ProductCategory | null,
): Promise<void> {
  await publishMerchantEvent(
    merchantId,
    "product.created",
    { product: toProductResponse(product, category) },
    { productId: product.id },
  );
}

export async function publishProductUpdatedRealtime(
  merchantId: string,
  product: Product,
  category?: ProductCategory | null,
): Promise<void> {
  await publishMerchantEvent(
    merchantId,
    "product.updated",
    { product: toProductResponse(product, category) },
    { productId: product.id },
  );
}
