"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { formatDateTime } from "../../lib/format";
import type { RealtimeConnectionStatus } from "../../lib/use-merchant-realtime";
import { RealtimeStatus } from "../realtime-status";

export function PosHeader({
  lastUpdated,
  onRefresh,
  refreshing,
  connectionStatus,
}: {
  lastUpdated: Date | null;
  onRefresh: () => void;
  refreshing?: boolean;
  connectionStatus?: RealtimeConnectionStatus;
}) {
  return (
    <header className="pos-header">
      <div className="pos-header__lead">
        <h1 className="pos-header__title">Order Line</h1>
        <p className="pos-header__subtitle">
          Active orders and fulfillment — live updates with polling fallback
        </p>
      </div>
      <div className="pos-header__actions">
        {connectionStatus ? (
          <RealtimeStatus status={connectionStatus} />
        ) : null}
        <span className="pos-header__updated">
          {lastUpdated
            ? `Updated ${formatDateTime(lastUpdated.toISOString())}`
            : "Loading…"}
        </span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={refreshing}
          onClick={onRefresh}
          aria-label="Refresh order line"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "pos-header__spin" : undefined}
            aria-hidden
          />
          {refreshing ? "Refreshing…" : "Refresh"}
        </Button>
      </div>
    </header>
  );
}
