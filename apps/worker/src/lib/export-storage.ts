import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  buildRelativeExportFilePath,
  getExportStorageDir,
} from "@airrand/domain";
import { resolveExportAbsolutePath } from "./audit-export-storage.js";

export function getWorkerExportStorageDir(): string {
  return getExportStorageDir();
}

export async function writeAuditExportFile(
  merchantId: string,
  exportJobId: string,
  csvContent: string,
): Promise<string> {
  const relativePath = buildRelativeExportFilePath(merchantId, exportJobId);
  const absolutePath = resolveExportAbsolutePath(
    getWorkerExportStorageDir(),
    relativePath,
  );

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, csvContent, "utf8");

  return relativePath;
}
