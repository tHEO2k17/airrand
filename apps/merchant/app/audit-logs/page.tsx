"use client";

import { useCallback, useEffect, useState } from "react";
import type { AuditExportJobResponse, AuditLogResponse } from "@airrand/contracts";
import { AlertMessage } from "../../components/ui/alert-message";
import { NotificationFeedback } from "../../components/ui/notification-feedback";
import { NOTIFICATION_UI_COPY } from "@airrand/notifications/templates";
import { Button } from "../../components/ui/button";
import { LoadingState } from "../../components/ui/loading-state";
import { MerchantGate } from "../../components/merchant-gate";
import { PageShell } from "../../components/page-shell";
import { Surface } from "../../components/ui/surface";
import { useMerchant } from "../../components/merchant-context";
import {
  ApiError,
  downloadAuditExportCsv,
  fetchAuditExportStatus,
  fetchAuditLogs,
  requestAuditExport,
} from "../../lib/api";
import { formatDateTime } from "../../lib/format";
import { isForbiddenApiError } from "../../lib/permissions";
import { useMerchantPermissions } from "../../lib/use-merchant-permissions";

const EXPORT_POLL_MS = 4000;

function exportStatusLabel(status: AuditExportJobResponse["status"]): string {
  switch (status) {
    case "queued":
      return "Queued";
    case "processing":
      return "Processing";
    case "completed":
      return "Ready";
    case "failed":
      return "Failed";
  }
}

function AuditLogsContent() {
  const { merchantId } = useMerchant();
  const { canViewAuditLogs } = useMerchantPermissions();
  const [logs, setLogs] = useState<AuditLogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [activeExportJobId, setActiveExportJobId] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<AuditExportJobResponse | null>(
    null,
  );

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

  useEffect(() => {
    if (!merchantId || !activeExportJobId) {
      return;
    }

    let cancelled = false;
    const intervalId = window.setInterval(() => {
      void fetchAuditExportStatus(merchantId, activeExportJobId)
        .then((status) => {
          if (cancelled) {
            return;
          }
          setExportStatus(status);
          if (status.status === "failed") {
            setError(status.errorMessage ?? "Audit export failed.");
          }
          if (status.status === "completed" || status.status === "failed") {
            window.clearInterval(intervalId);
          }
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setError(
              err instanceof Error ? err.message : "Failed to check export status",
            );
          }
        });
    }, EXPORT_POLL_MS);

    void fetchAuditExportStatus(merchantId, activeExportJobId)
      .then((status) => {
        if (cancelled) {
          return;
        }
        setExportStatus(status);
        if (status.status === "failed") {
          setError(status.errorMessage ?? "Audit export failed.");
        }
        if (status.status === "completed" || status.status === "failed") {
          window.clearInterval(intervalId);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to check export status",
          );
        }
      });

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [merchantId, activeExportJobId]);

  async function handleRequestExport() {
    if (!merchantId) {
      return;
    }
    setExporting(true);
    setError(null);
    setExportStatus(null);
    try {
      const result = await requestAuditExport(merchantId);
      setActiveExportJobId(result.exportJobId);
      setExportStatus({
        exportJobId: result.exportJobId,
        merchantId,
        status: result.status,
        format: "csv",
        createdAt: new Date().toISOString(),
        startedAt: null,
        completedAt: null,
        downloadUrl: null,
        errorMessage: null,
      });
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

  async function handleDownloadExport() {
    if (!merchantId || !activeExportJobId) {
      return;
    }
    setDownloading(true);
    setError(null);
    try {
      const blob = await downloadAuditExportCsv(merchantId, activeExportJobId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `audit-export-${activeExportJobId}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download export");
    } finally {
      setDownloading(false);
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
        {exportStatus ? (
          <span className="pos-muted">
            Export {exportStatus.exportJobId.slice(0, 8)}… —{" "}
            {exportStatusLabel(exportStatus.status)}
          </span>
        ) : null}
        {exportStatus?.status === "completed" ? (
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => void handleDownloadExport()}
            disabled={downloading}
          >
            {downloading ? "Downloading…" : "Download CSV"}
          </Button>
        ) : null}
      </Surface>
      {exportStatus?.status === "completed" ? (
        <>
          <NotificationFeedback
            kind="actionSuccess"
            message={`Export ready (job ${exportStatus.exportJobId}).`}
          />
          <NotificationFeedback
            kind="notificationQueued"
            message={NOTIFICATION_UI_COPY.exportCompleteQueued}
          />
        </>
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
