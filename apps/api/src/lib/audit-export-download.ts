import { createReadStream } from "node:fs";
import { access } from "node:fs/promises";
import {
  buildAuditExportDownloadFilename,
  getExportStorageDir,
} from "@airrand/domain";
import type { AuditExportJob } from "@airrand/database";
import { resolveExportAbsolutePath } from "./audit-export-storage.js";

export function getApiExportStorageDir(): string {
  return getExportStorageDir();
}

export async function resolveCompletedExportFilePath(
  job: AuditExportJob,
): Promise<string> {
  if (job.status !== "completed" || !job.filePath) {
    throw new ExportDownloadError(
      "EXPORT_NOT_READY",
      "Export is not ready for download",
      409,
    );
  }

  let absolutePath: string;
  try {
    absolutePath = resolveExportAbsolutePath(
      getApiExportStorageDir(),
      job.filePath,
    );
  } catch {
    throw new ExportDownloadError(
      "EXPORT_FILE_INVALID",
      "Export file is not available",
      404,
    );
  }

  try {
    await access(absolutePath);
  } catch {
    throw new ExportDownloadError(
      "EXPORT_FILE_MISSING",
      "Export file is not available",
      404,
    );
  }

  return absolutePath;
}

export function openExportFileStream(absolutePath: string) {
  return createReadStream(absolutePath);
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
