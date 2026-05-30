import type { AuditLog, Merchant } from "@airrand/database";
import { describe, expect, it, vi } from "vitest";
import { listAuditLogsHandler } from "./list-audit-logs.handler.js";
import type { AuditLogsRepository } from "../../repositories/audit-logs.repository.js";
import type { MerchantsRepository } from "../../repositories/merchants.repository.js";

function merchant(): Merchant {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Kofi Mart",
    slug: "kofi-mart",
    description: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  };
}

function auditLog(): AuditLog {
  return {
    id: "66666666-6666-6666-6666-666666666666",
    merchantId: merchant().id,
    orderId: "44444444-4444-4444-4444-444444444444",
    actorType: "merchant_staff",
    actorLabel: "Owner",
    action: "order.status_changed",
    metadata: { fromStatus: "placed", toStatus: "accepted" },
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  };
}

describe("listAuditLogsHandler", () => {
  it("returns merchant_not_found when merchant is missing", async () => {
    const merchantsRepository: MerchantsRepository = {
      listOrderedByName: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      findBySlug: vi.fn(),
    };
    const auditLogsRepository: AuditLogsRepository = {
      listRecentByMerchantId: vi.fn(),
    };

    const result = await listAuditLogsHandler(
      { merchantId: merchant().id },
      { merchantsRepository, auditLogsRepository },
    );

    expect(result).toEqual({ kind: "merchant_not_found" });
  });

  it("returns mapped audit logs", async () => {
    const merchantsRepository: MerchantsRepository = {
      listOrderedByName: vi.fn(),
      findById: vi.fn().mockResolvedValue(merchant()),
      findBySlug: vi.fn(),
    };
    const auditLogsRepository: AuditLogsRepository = {
      listRecentByMerchantId: vi.fn().mockResolvedValue([
        { log: auditLog(), orderReference: "ORD-1001" },
      ]),
    };

    const result = await listAuditLogsHandler(
      { merchantId: merchant().id },
      { merchantsRepository, auditLogsRepository },
    );

    expect(result).toEqual({
      kind: "ok",
      auditLogs: [
        {
          id: auditLog().id,
          merchantId: merchant().id,
          orderId: auditLog().orderId,
          orderReference: "ORD-1001",
          actorType: "merchant_staff",
          actorLabel: "Owner",
          action: "order.status_changed",
          metadata: { fromStatus: "placed", toStatus: "accepted" },
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    });
  });
});
