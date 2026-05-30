import { describe, expect, it } from "vitest";
import {
  assertSafeRelativeExportPath,
  buildRelativeExportFilePath,
} from "./audit-export-storage.js";

describe("audit export storage paths", () => {
  it("builds merchant-scoped relative paths", () => {
    expect(
      buildRelativeExportFilePath(
        "11111111-1111-1111-1111-111111111111",
        "22222222-2222-2222-2222-222222222222",
      ),
    ).toBe("11111111-1111-1111-1111-111111111111/22222222-2222-2222-2222-222222222222.csv");
  });

  it("rejects path traversal in relative paths", () => {
    expect(() => assertSafeRelativeExportPath("../../etc/passwd")).toThrow(
      "Invalid export file path",
    );
  });
});
