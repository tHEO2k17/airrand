import type { AuditLogResponse } from "@airrand/contracts";
import { toAuditLogResponse } from "../../lib/audit.js";
import {
  auditLogsRepository,
  type AuditLogsRepository,
} from "../../repositories/audit-logs.repository.js";
import {
  merchantsRepository,
  type MerchantsRepository,
} from "../../repositories/merchants.repository.js";
import type { ListAuditLogsQuery } from "./list-audit-logs.query.js";

export type ListAuditLogsResult =
  | { kind: "merchant_not_found" }
  | { kind: "ok"; auditLogs: AuditLogResponse[] };

export type ListAuditLogsDeps = {
  merchantsRepository: MerchantsRepository;
  auditLogsRepository: AuditLogsRepository;
};

export async function listAuditLogsHandler(
  query: ListAuditLogsQuery,
  deps: ListAuditLogsDeps = {
    merchantsRepository,
    auditLogsRepository,
  },
): Promise<ListAuditLogsResult> {
  const merchant = await deps.merchantsRepository.findById(query.merchantId);
  if (!merchant) {
    return { kind: "merchant_not_found" };
  }

  const rows = await deps.auditLogsRepository.listRecentByMerchantId(
    query.merchantId,
  );

  return {
    kind: "ok",
    auditLogs: rows.map((row) => toAuditLogResponse(row.log, row.orderReference)),
  };
}
