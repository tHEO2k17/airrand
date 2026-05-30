import type { AuditLog } from "@airrand/database";
import type { AuditLogResponse } from "@airrand/contracts";

export function toAuditLogResponse(
  log: AuditLog,
  orderReference?: string | null,
): AuditLogResponse {
  return {
    id: log.id,
    merchantId: log.merchantId,
    orderId: log.orderId,
    orderReference: orderReference ?? null,
    actorType: log.actorType,
    actorLabel: log.actorLabel,
    action: log.action,
    metadata: log.metadata ?? {},
    createdAt: log.createdAt.toISOString(),
  };
}
