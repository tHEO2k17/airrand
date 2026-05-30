import type { CustomerOrderStatusResponse } from "@airrand/contracts";
import { normalizeOrderReferenceQuery } from "@airrand/domain";
import { toCustomerOrderStatusResponse } from "../../lib/customer-order-status.js";
import {
  merchantsRepository,
  type MerchantsRepository,
} from "../../repositories/merchants.repository.js";
import {
  ordersRepository,
  type OrdersRepository,
} from "../../repositories/orders.repository.js";
import type { GetCustomerOrderStatusBySlugReferenceQuery } from "./get-customer-order-status-by-slug-reference.query.js";

export type GetCustomerOrderStatusBySlugReferenceResult =
  | { kind: "merchant_not_found" }
  | { kind: "order_not_found" }
  | { kind: "ok"; status: CustomerOrderStatusResponse };

export type GetCustomerOrderStatusBySlugReferenceDeps = {
  merchantsRepository: MerchantsRepository;
  ordersRepository: OrdersRepository;
};

export async function getCustomerOrderStatusBySlugReferenceHandler(
  query: GetCustomerOrderStatusBySlugReferenceQuery,
  deps: GetCustomerOrderStatusBySlugReferenceDeps = {
    merchantsRepository,
    ordersRepository,
  },
): Promise<GetCustomerOrderStatusBySlugReferenceResult> {
  const merchant = await deps.merchantsRepository.findBySlug(query.slug);
  if (!merchant) {
    return { kind: "merchant_not_found" };
  }

  const reference = normalizeOrderReferenceQuery(query.reference);

  const order = await deps.ordersRepository.findByMerchantAndReference(
    merchant.id,
    reference,
  );
  if (!order) {
    return { kind: "order_not_found" };
  }

  const lines = await deps.ordersRepository.listLinesByOrderId(order.id);

  return {
    kind: "ok",
    status: toCustomerOrderStatusResponse(order, lines, merchant),
  };
}
