export const DEFAULT_EXPORT_STORAGE_DIR = "./storage/exports";

export function getExportStorageDir(
  env: NodeJS.ProcessEnv = process.env,
): string {
  return env.EXPORT_STORAGE_DIR?.trim() || DEFAULT_EXPORT_STORAGE_DIR;
}

export function buildRelativeExportFilePath(
  merchantId: string,
  exportJobId: string,
): string {
  return `${merchantId}/${exportJobId}.csv`;
}

export function assertSafeRelativeExportPath(relativeFilePath: string): void {
  const normalized = relativeFilePath.replace(/\\/g, "/");
  if (
    normalized.startsWith("/") ||
    normalized.includes("..") ||
    normalized.includes("\0")
  ) {
    throw new Error("Invalid export file path");
  }
}

export function buildAuditExportDownloadFilename(exportJobId: string): string {
  return `audit-export-${exportJobId}.csv`;
}
