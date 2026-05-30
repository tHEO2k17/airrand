import { describe, expect, it, vi, beforeEach } from "vitest";
import { Readable } from "node:stream";
import {
  ExportDownloadError,
  openCompletedExportReadStream,
} from "./audit-export-download.js";
import type { AuditExportJob } from "@airrand/database";

const objectExists = vi.fn();
const getObjectStream = vi.fn();

vi.mock("./storage.js", () => ({
  getStorageProvider: vi.fn(() =>
    Promise.resolve({
      objectExists,
      getObjectStream,
    }),
  ),
}));

describe("audit export download helper", () => {
  const completedJob = {
    id: "22222222-2222-2222-2222-222222222222",
    merchantId: "11111111-1111-1111-1111-111111111111",
    requestedByMerchantUserId: "33333333-3333-3333-3333-333333333333",
    bullJobId: "bull-1",
    status: "completed",
    format: "csv",
    objectKey: "audit-exports/11111111-1111-1111-1111-111111111111/job.csv",
    errorMessage: null,
    createdAt: new Date(),
    startedAt: new Date(),
    completedAt: new Date(),
  } satisfies AuditExportJob;

  beforeEach(() => {
    objectExists.mockReset();
    getObjectStream.mockReset();
  });

  it("rejects path traversal in stored object keys", async () => {
    await expect(
      openCompletedExportReadStream({
        ...completedJob,
        objectKey: "../../etc/passwd",
      }),
    ).rejects.toBeInstanceOf(ExportDownloadError);
  });

  it("rejects downloads when export is not completed", async () => {
    await expect(
      openCompletedExportReadStream({
        ...completedJob,
        status: "processing",
        objectKey: null,
      }),
    ).rejects.toMatchObject({
      code: "EXPORT_NOT_READY",
      status: 409,
    });
  });

  it("streams object when export is ready", async () => {
    const stream = Readable.from(["a,b"]);
    objectExists.mockResolvedValueOnce(true);
    getObjectStream.mockResolvedValueOnce(stream);

    await expect(openCompletedExportReadStream(completedJob)).resolves.toBe(stream);
  });

  it("returns missing when object is absent", async () => {
    objectExists.mockResolvedValueOnce(false);

    await expect(openCompletedExportReadStream(completedJob)).rejects.toMatchObject({
      code: "EXPORT_FILE_MISSING",
      status: 404,
    });
  });
});
