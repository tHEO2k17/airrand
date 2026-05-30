import type {
  MerchantResponse,
  OrderLineResponse,
  OrderResponse,
  ProductResponse,
} from "@airrand/contracts";
import type {
  Merchant,
  Order,
  OrderLine,
  Product,
} from "@airrand/database";

export function toMerchantResponse(merchant: Merchant): MerchantResponse {
  return {
    id: merchant.id,
    name: merchant.name,
    slug: merchant.slug,
    createdAt: merchant.createdAt.toISOString(),
    updatedAt: merchant.updatedAt.toISOString(),
  };
}

export function toProductResponse(product: Product): ProductResponse {
  return {
    id: product.id,
    merchantId: product.merchantId,
    name: product.name,
    description: product.description,
    unitPriceCents: product.unitPriceCents,
    isAvailable: product.isAvailable,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export function toOrderLineResponse(line: OrderLine): OrderLineResponse {
  return {
    id: line.id,
    productId: line.productId,
    quantity: line.quantity,
    productName: line.productName,
    unitPriceCents: line.unitPriceCents,
  };
}

export function toOrderResponse(
  order: Order,
  lines: OrderLine[],
): OrderResponse {
  return {
    id: order.id,
    merchantId: order.merchantId,
    status: order.status,
    customerName: order.customerName,
    customerContact: order.customerContact,
    notes: order.notes,
    pickedUpAt: order.pickedUpAt?.toISOString() ?? null,
    lines: lines.map(toOrderLineResponse),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}
