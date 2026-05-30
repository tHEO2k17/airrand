"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { formatDateTime } from "../../lib/format";

export function PosHeader({
  lastUpdated,
  onRefresh,
  refreshing,
}: {
  lastUpdated: Date | null;
  onRefresh: () => void;
  refreshing?: boolean;
}) {
  return (
    <header className="pos-header">
      <div className="pos-header__lead">
        <h1 className="pos-header__title">Order Line</h1>
        <p className="pos-header__subtitle">
          Active orders and fulfillment — refreshes every 10 seconds
        </p>
      </div>
      <div className="pos-header__actions">
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
