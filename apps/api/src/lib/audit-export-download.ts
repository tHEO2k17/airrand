import { Readable } from "node:stream";
import {
  assertSafeObjectKey,
  buildAuditExportDownloadFilename,
} from "@airrand/domain";
import type { AuditExportJob } from "@airrand/database";
import { getStorageProvider } from "./storage.js";

export async function openCompletedExportReadStream(
  job: AuditExportJob,
): Promise<Readable> {
  if (job.status !== "completed" || !job.objectKey) {
    throw new ExportDownloadError(
      "EXPORT_NOT_READY",
      "Export is not ready for download",
      409,
    );
  }

  try {
    assertSafeObjectKey(job.objectKey);
  } catch {
    throw new ExportDownloadError(
      "EXPORT_FILE_INVALID",
      "Export file is not available",
      404,
    );
  }

  const storage = await getStorageProvider();
  const exists = await storage.objectExists({ key: job.objectKey });
  if (!exists) {
    throw new ExportDownloadError(
      "EXPORT_FILE_MISSING",
      "Export file is not available",
      404,
    );
  }

  return storage.getObjectStream({ key: job.objectKey });
}

export function getExportDownloadFilename(exportJobId: string): string {
  return buildAuditExportDownloadFilename(exportJobId);
}

export class ExportDownloadError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ExportDownloadError";
  }
}
