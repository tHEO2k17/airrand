import type {
  MerchantResponse,
  MerchantUserResponse,
  OrderLineResponse,
  OrderResponse,
  ProductCategoryResponse,
  ProductCategorySummary,
  ProductResponse,
} from "@airrand/contracts";
import type {
  Merchant,
  MerchantUser,
  Order,
  OrderLine,
  Product,
  ProductCategory,
} from "@airrand/database";

export function toMerchantUserResponse(
  user: MerchantUser,
): MerchantUserResponse {
  return {
    id: user.id,
    merchantId: user.merchantId,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
  };
}

export function toMerchantResponse(merchant: Merchant): MerchantResponse {
  return {
    id: merchant.id,
    name: merchant.name,
    slug: merchant.slug,
    description: merchant.description ?? null,
    createdAt: merchant.createdAt.toISOString(),
    updatedAt: merchant.updatedAt.toISOString(),
  };
}

export function toProductCategorySummary(
  category: ProductCategory | null | undefined,
): ProductCategorySummary | null {
  if (!category) {
    return null;
  }
  return {
    id: category.id,
    name: category.name,
    iconKey: category.iconKey,
    isActive: category.isActive,
  };
}

export function toProductCategoryResponse(
  category: ProductCategory,
): ProductCategoryResponse {
  return {
    id: category.id,
    merchantId: category.merchantId,
    name: category.name,
    iconKey: category.iconKey,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

export function toProductResponse(
  product: Product,
  category?: ProductCategory | null,
): ProductResponse {
  return {
    id: product.id,
    merchantId: product.merchantId,
    categoryId: product.categoryId,
    category: toProductCategorySummary(category ?? null),
    name: product.name,
    description: product.description,
    unitPriceCents: product.unitPriceCents,
    isAvailable: product.isAvailable,
    stockState: product.stockState,
    stockQuantity: product.stockQuantity,
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
    reference: order.reference,
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
