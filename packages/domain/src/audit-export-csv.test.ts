import { describe, expect, it } from "vitest";
import {
  buildAuditExportCsv,
  escapeCsvField,
  sanitizeAuditExportMetadata,
} from "./audit-export-csv.js";

describe("audit export CSV", () => {
  it("escapes commas and quotes", () => {
    expect(escapeCsvField('hello, "world"')).toBe('"hello, ""world"""');
  });

  it("strips sensitive metadata keys", () => {
    const sanitized = sanitizeAuditExportMetadata({
      orderId: "abc",
      password_hash: "secret",
      token: "x",
    });

    expect(sanitized).toEqual({ orderId: "abc" });
  });

  it("builds CSV with expected headers and rows", () => {
    const csv = buildAuditExportCsv([
      {
        createdAt: "2026-01-01T12:00:00.000Z",
        action: "order.created",
        actorType: "customer",
        actorLabel: "Guest",
        orderReference: "ORD-1001",
        metadata: { note: "pickup" },
      },
    ]);

    expect(csv).toContain(
      "created_at,action,actor_type,actor_label,order_reference,metadata_json",
    );
    expect(csv).toContain(
      '2026-01-01T12:00:00.000Z,order.created,customer,Guest,ORD-1001,"{""note"":""pickup""}"',
    );
  });
});
