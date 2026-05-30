import { describe, expect, it } from "vitest";
import { resolveExportAbsolutePath } from "./audit-export-storage.js";

describe("api audit export storage", () => {
  it("resolves safe paths under storage root", () => {
    const absolute = resolveExportAbsolutePath(
      "/tmp/exports",
      "11111111-1111-1111-1111-111111111111/job.csv",
    );

    expect(absolute).toBe(
      "/tmp/exports/11111111-1111-1111-1111-111111111111/job.csv",
    );
  });
});
