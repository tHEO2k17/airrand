import type { AuditLog } from "@airrand/database";
import type { AuditLogResponse } from "@airrand/contracts";

export function toAuditLogResponse(log: AuditLog): AuditLogResponse {
  return {
    id: log.id,
    merchantId: log.merchantId,
    orderId: log.orderId,
    actorType: log.actorType,
    actorLabel: log.actorLabel,
    action: log.action,
    metadata: log.metadata ?? {},
    createdAt: log.createdAt.toISOString(),
  };
}
