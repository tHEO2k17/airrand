import { buildAuditExportObjectKey } from "@airrand/domain";
import { getStorageProvider } from "./storage.js";

export async function uploadAuditExportCsv(
  merchantId: string,
  exportJobId: string,
  csvContent: string,
): Promise<string> {
  const objectKey = buildAuditExportObjectKey(merchantId, exportJobId);
  const storage = await getStorageProvider();

  await storage.uploadObject({
    key: objectKey,
    body: csvContent,
    contentType: "text/csv; charset=utf-8",
  });

  return objectKey;
}
