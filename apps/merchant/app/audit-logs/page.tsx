"use client";

import { useCallback, useEffect, useState } from "react";
import type { AuditLogResponse } from "@airrand/contracts";
import { AlertMessage } from "../../components/ui/alert-message";
import { Button } from "../../components/ui/button";
import { LoadingState } from "../../components/ui/loading-state";
import { MerchantGate } from "../../components/merchant-gate";
import { PageShell } from "../../components/page-shell";
import { Surface } from "../../components/ui/surface";
import { useMerchant } from "../../components/merchant-context";
import { ApiError, fetchAuditLogs, requestAuditExport } from "../../lib/api";
import { formatDateTime } from "../../lib/format";
import { isForbiddenApiError } from "../../lib/permissions";
import { useMerchantPermissions } from "../../lib/use-merchant-permissions";

function AuditLogsContent() {
  const { merchantId } = useMerchant();
  const { canViewAuditLogs } = useMerchantPermissions();
  const [logs, setLogs] = useState<AuditLogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!merchantId || !canViewAuditLogs) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchAuditLogs(merchantId);
      setLogs(rows);
    } catch (err) {
      if (err instanceof ApiError && isForbiddenApiError(err)) {
        setError("You do not have permission to view audit logs.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to load audit logs");
      }
    } finally {
      setLoading(false);
    }
  }, [merchantId, canViewAuditLogs]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRequestExport() {
    if (!merchantId) {
      return;
    }
    setExporting(true);
    setError(null);
    setExportSuccess(null);
    try {
      const result = await requestAuditExport(merchantId);
      setExportSuccess(`Export queued (job ${result.jobId}).`);
    } catch (err) {
      if (err instanceof ApiError && isForbiddenApiError(err)) {
        setError("You do not have permission to export audit logs.");
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(
          err instanceof Error ? err.message : "Failed to request audit export",
        );
      }
    } finally {
      setExporting(false);
    }
  }

  if (!canViewAuditLogs) {
    return (
      <PageShell
        title="Audit log"
        description="Recent order and pickup events for this merchant."
      >
        <Surface>
          <AlertMessage
            variant="error"
            message="You do not have permission to view audit logs."
          />
        </Surface>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Audit log"
      description="Recent order and pickup events for this merchant."
    >
      <Surface className="audit-export-toolbar">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => void handleRequestExport()}
          disabled={exporting}
        >
          {exporting ? "Requesting…" : "Request Export"}
        </Button>
      </Surface>
      {exportSuccess ? (
        <AlertMessage variant="success" message={exportSuccess} />
      ) : null}
      {error ? <AlertMessage variant="error" message={error} /> : null}
      {loading ? <LoadingState /> : null}

      {!loading && logs.length === 0 && !error ? (
        <Surface>
          <p className="pos-muted">No audit events yet.</p>
        </Surface>
      ) : null}

      {!loading && logs.length > 0 ? (
        <Surface padding="none" className="pos-table-wrap">
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Action</th>
                <th>Actor</th>
                <th>Order</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{formatDateTime(log.createdAt)}</td>
                  <td>
                    <code>{log.action}</code>
                  </td>
                  <td>
                    {log.actorType}
                    {log.actorLabel ? ` (${log.actorLabel})` : ""}
                  </td>
                  <td>
                    {log.orderReference ? (
                      <strong>{log.orderReference}</strong>
                    ) : log.orderId ? (
                      <span className="pos-muted">—</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <pre className="pos-audit-metadata">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Surface>
      ) : null}
    </PageShell>
  );
}

export default function AuditLogsPage() {
  return (
    <MerchantGate>
      <AuditLogsContent />
    </MerchantGate>
  );
}
