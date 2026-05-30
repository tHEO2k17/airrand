import {
  auditLogs,
  orders,
  type AuditLog,
  type Database,
} from "@airrand/database";
import { desc, eq } from "drizzle-orm";
import { db } from "../lib/db.js";

export type AuditLogWithOrderReference = {
  log: AuditLog;
  orderReference: string | null;
};

export type AuditLogsRepository = {
  listRecentByMerchantId: (
    merchantId: string,
  ) => Promise<AuditLogWithOrderReference[]>;
};

export function createAuditLogsRepository(
  database: Database = db,
): AuditLogsRepository {
  return {
    async listRecentByMerchantId(merchantId: string) {
      return database
        .select({
          log: auditLogs,
          orderReference: orders.reference,
        })
        .from(auditLogs)
        .leftJoin(orders, eq(auditLogs.orderId, orders.id))
        .where(eq(auditLogs.merchantId, merchantId))
        .orderBy(desc(auditLogs.createdAt))
        .limit(100);
    },
  };
}

export const auditLogsRepository = createAuditLogsRepository();
