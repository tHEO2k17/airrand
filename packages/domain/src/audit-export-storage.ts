export const AUDIT_EXPORT_OBJECT_KEY_PREFIX = "audit-exports";

export function buildAuditExportObjectKey(
  merchantId: string,
  exportJobId: string,
): string {
  return `${AUDIT_EXPORT_OBJECT_KEY_PREFIX}/${merchantId}/${exportJobId}.csv`;
}

export function assertSafeObjectKey(objectKey: string): void {
  const normalized = objectKey.replace(/\\/g, "/");
  if (
    normalized.startsWith("/") ||
    normalized.includes("..") ||
    normalized.includes("\0") ||
    !normalized.startsWith(`${AUDIT_EXPORT_OBJECT_KEY_PREFIX}/`)
  ) {
    throw new Error("Invalid export object key");
  }
}

export function buildAuditExportDownloadFilename(exportJobId: string): string {
  return `audit-export-${exportJobId}.csv`;
}
