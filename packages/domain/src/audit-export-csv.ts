const SENSITIVE_METADATA_KEYS = new Set([
  "password",
  "passwordhash",
  "password_hash",
  "token",
  "secret",
  "session",
  "authorization",
  "cookie",
  "nonce",
  "pickuptoken",
  "pickup_token",
]);

export type AuditExportCsvRow = {
  createdAt: string;
  action: string;
  actorType: string;
  actorLabel: string | null;
  orderReference: string | null;
  metadata: Record<string, unknown>;
};

export const AUDIT_EXPORT_CSV_HEADERS = [
  "created_at",
  "action",
  "actor_type",
  "actor_label",
  "order_reference",
  "metadata_json",
] as const;

export function sanitizeAuditExportMetadata(
  metadata: Record<string, unknown>,
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (SENSITIVE_METADATA_KEYS.has(key.toLowerCase())) {
      continue;
    }
    sanitized[key] = value;
  }

  return sanitized;
}

export function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function formatAuditExportCsvRow(row: AuditExportCsvRow): string {
  const fields = [
    row.createdAt,
    row.action,
    row.actorType,
    row.actorLabel ?? "",
    row.orderReference ?? "",
    JSON.stringify(sanitizeAuditExportMetadata(row.metadata)),
  ];

  return fields.map((field) => escapeCsvField(field)).join(",");
}

export function buildAuditExportCsv(rows: AuditExportCsvRow[]): string {
  const header = AUDIT_EXPORT_CSV_HEADERS.join(",");
  const body = rows.map((row) => formatAuditExportCsvRow(row));
  return [header, ...body].join("\n");
}
