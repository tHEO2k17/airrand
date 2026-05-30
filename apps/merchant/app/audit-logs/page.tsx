"use client";

import { useCallback, useEffect, useState } from "react";
import type { AuditLogResponse } from "@airrand/contracts";
import { AlertMessage } from "../../components/ui/alert-message";
import { LoadingState } from "../../components/ui/loading-state";
import { MerchantGate } from "../../components/merchant-gate";
import { PageShell } from "../../components/page-shell";
import { Surface } from "../../components/ui/surface";
import { useMerchant } from "../../components/merchant-context";
import { fetchAuditLogs } from "../../lib/api";
import { formatDateTime } from "../../lib/format";

function AuditLogsContent() {
  const { merchantId } = useMerchant();
  const [logs, setLogs] = useState<AuditLogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!merchantId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchAuditLogs(merchantId);
      setLogs(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PageShell
      title="Audit log"
      description="Recent order and pickup events for this merchant."
    >
      {error ? <AlertMessage variant="error" message={error} /> : null}
      {loading ? <LoadingState /> : null}

      {!loading && logs.length === 0 ? (
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
                    {log.orderId ? (
                      <code>{log.orderId.slice(0, 8)}…</code>
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
