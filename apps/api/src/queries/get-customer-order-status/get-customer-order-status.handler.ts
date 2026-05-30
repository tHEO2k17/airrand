import type { CustomerOrderStatusResponse } from "@airrand/contracts";
import { toCustomerOrderStatusResponse } from "../../lib/customer-order-status.js";
import {
  merchantsRepository,
  type MerchantsRepository,
} from "../../repositories/merchants.repository.js";
import {
  ordersRepository,
  type OrdersRepository,
} from "../../repositories/orders.repository.js";
import type { GetCustomerOrderStatusQuery } from "./get-customer-order-status.query.js";

export type GetCustomerOrderStatusResult =
  | { kind: "merchant_not_found" }
  | { kind: "order_not_found" }
  | { kind: "ok"; status: CustomerOrderStatusResponse };

export type GetCustomerOrderStatusDeps = {
  merchantsRepository: MerchantsRepository;
  ordersRepository: OrdersRepository;
};

export async function getCustomerOrderStatusHandler(
  query: GetCustomerOrderStatusQuery,
  deps: GetCustomerOrderStatusDeps = {
    merchantsRepository,
    ordersRepository,
  },
): Promise<GetCustomerOrderStatusResult> {
  const merchant = await deps.merchantsRepository.findById(query.merchantId);
  if (!merchant) {
    return { kind: "merchant_not_found" };
  }

  const order = await deps.ordersRepository.findByMerchantAndOrderId(
    query.merchantId,
    query.orderId,
  );
  if (!order) {
    return { kind: "order_not_found" };
  }

  const lines = await deps.ordersRepository.listLinesByOrderId(query.orderId);

  return {
    kind: "ok",
    status: toCustomerOrderStatusResponse(order, lines, merchant),
  };
}
