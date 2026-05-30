import {
  orderLines,
  orders,
  type Database,
  type Order,
  type OrderLine,
} from "@airrand/database";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "../lib/db.js";

export type OrdersRepository = {
  listByMerchantId: (
    merchantId: string,
    reference?: string,
  ) => Promise<Order[]>;
  listLinesByOrderIds: (orderIds: string[]) => Promise<OrderLine[]>;
  listLinesByOrderId: (orderId: string) => Promise<OrderLine[]>;
  findByMerchantAndOrderId: (
    merchantId: string,
    orderId: string,
  ) => Promise<Order | null>;
  findByMerchantAndReference: (
    merchantId: string,
    reference: string,
  ) => Promise<Order | null>;
};

export function createOrdersRepository(database: Database = db): OrdersRepository {
  return {
    async listByMerchantId(merchantId: string, reference?: string) {
      const conditions = [eq(orders.merchantId, merchantId)];
      if (reference) {
        conditions.push(eq(orders.reference, reference));
      }

      return database
        .select()
        .from(orders)
        .where(and(...conditions))
        .orderBy(asc(orders.createdAt));
    },

    async listLinesByOrderIds(orderIds: string[]) {
      if (orderIds.length === 0) {
        return [];
      }

      return database
        .select()
        .from(orderLines)
        .where(inArray(orderLines.orderId, orderIds));
    },

    async listLinesByOrderId(orderId: string) {
      return database
        .select()
        .from(orderLines)
        .where(eq(orderLines.orderId, orderId));
    },

    async findByMerchantAndOrderId(merchantId: string, orderId: string) {
      const [order] = await database
        .select()
        .from(orders)
        .where(and(eq(orders.id, orderId), eq(orders.merchantId, merchantId)))
        .limit(1);
      return order ?? null;
    },

    async findByMerchantAndReference(merchantId: string, reference: string) {
      const [order] = await database
        .select()
        .from(orders)
        .where(
          and(eq(orders.merchantId, merchantId), eq(orders.reference, reference)),
        )
        .limit(1);
      return order ?? null;
    },
  };
}

export const ordersRepository = createOrdersRepository();
