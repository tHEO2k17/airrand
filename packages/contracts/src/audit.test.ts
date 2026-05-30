import { describe, expect, it } from "vitest";
import {
  auditExportQueuedResponseSchema,
  auditExportRequestSchema,
} from "./audit.js";

describe("audit export contracts", () => {
  it("defaults export format to csv", () => {
    const parsed = auditExportRequestSchema.parse({});
    expect(parsed.format).toBe("csv");
  });

  it("accepts explicit csv format", () => {
    const parsed = auditExportRequestSchema.parse({ format: "csv" });
    expect(parsed.format).toBe("csv");
  });

  it("rejects unknown export formats", () => {
    expect(() =>
      auditExportRequestSchema.parse({ format: "pdf" }),
    ).toThrow();
  });

  it("parses queued export response", () => {
    const parsed = auditExportQueuedResponseSchema.parse({
      jobId: "job-123",
      status: "queued",
    });
    expect(parsed.status).toBe("queued");
  });
});
