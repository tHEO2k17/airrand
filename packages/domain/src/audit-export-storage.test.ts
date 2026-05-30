import { describe, expect, it } from "vitest";
import {
  assertSafeObjectKey,
  buildAuditExportObjectKey,
} from "./audit-export-storage.js";

describe("audit export object keys", () => {
  it("builds merchant-scoped object keys", () => {
    expect(
      buildAuditExportObjectKey(
        "11111111-1111-1111-1111-111111111111",
        "22222222-2222-2222-2222-222222222222",
      ),
    ).toBe(
      "audit-exports/11111111-1111-1111-1111-111111111111/22222222-2222-2222-2222-222222222222.csv",
    );
  });

  it("rejects path traversal in object keys", () => {
    expect(() => assertSafeObjectKey("../../etc/passwd")).toThrow(
      "Invalid export object key",
    );
  });

  it("rejects keys outside audit-exports prefix", () => {
    expect(() =>
      assertSafeObjectKey("other-prefix/11111111-1111-1111-1111-111111111111/job.csv"),
    ).toThrow("Invalid export object key");
  });
});
