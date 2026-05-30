import { listOrdersQuerySchema, type OrderResponse } from "@airrand/contracts";
import { normalizeOrderReferenceQuery } from "@airrand/domain";
import { toOrderResponse } from "../../lib/mappers.js";
import {
  merchantsRepository,
  type MerchantsRepository,
} from "../../repositories/merchants.repository.js";
import {
  ordersRepository,
  type OrdersRepository,
} from "../../repositories/orders.repository.js";
import type { ListMerchantOrdersQuery } from "./list-merchant-orders.query.js";

export type ListMerchantOrdersResult =
  | { kind: "merchant_not_found" }
  | { kind: "validation_error"; message: string }
  | { kind: "ok"; orders: OrderResponse[] };

export type ListMerchantOrdersDeps = {
  merchantsRepository: MerchantsRepository;
  ordersRepository: OrdersRepository;
};

export async function listMerchantOrdersHandler(
  input: ListMerchantOrdersQuery,
  deps: ListMerchantOrdersDeps = {
    merchantsRepository,
    ordersRepository,
  },
): Promise<ListMerchantOrdersResult> {
  const merchant = await deps.merchantsRepository.findById(input.merchantId);
  if (!merchant) {
    return { kind: "merchant_not_found" };
  }

  const parsed = listOrdersQuerySchema.safeParse(input.query);
  if (!parsed.success) {
    return { kind: "validation_error", message: parsed.error.message };
  }

  const reference = parsed.data.reference
    ? normalizeOrderReferenceQuery(parsed.data.reference)
    : undefined;

  const orderRows = await deps.ordersRepository.listByMerchantId(
    input.merchantId,
    reference,
  );

  const orderIds = orderRows.map((order) => order.id);
  const lines = await deps.ordersRepository.listLinesByOrderIds(orderIds);

  const linesByOrderId = new Map<string, typeof lines>();
  for (const line of lines) {
    const existing = linesByOrderId.get(line.orderId) ?? [];
    existing.push(line);
    linesByOrderId.set(line.orderId, existing);
  }

  return {
    kind: "ok",
    orders: orderRows.map((order) =>
      toOrderResponse(order, linesByOrderId.get(order.id) ?? []),
    ),
  };
}
