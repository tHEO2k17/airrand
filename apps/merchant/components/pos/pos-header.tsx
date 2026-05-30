"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { OperationalAttentionToolbar } from "../operational-attention-toolbar";
import { formatDateTime } from "../../lib/format";
import type { RealtimeConnectionStatus } from "../../lib/use-merchant-realtime";
import type { BrowserNotificationPermissionState } from "../../lib/operational-attention/browser-notifications";
import { RealtimeStatus } from "../realtime-status";

export function PosHeader({
  lastUpdated,
  onRefresh,
  refreshing,
  connectionStatus,
  muted,
  onToggleMuted,
  notificationPermission,
  onRequestNotifications,
  focusMode,
  onToggleFocusMode,
  hasUnreadOrders,
}: {
  lastUpdated: Date | null;
  onRefresh: () => void;
  refreshing?: boolean;
  connectionStatus?: RealtimeConnectionStatus;
  muted: boolean;
  onToggleMuted: () => void;
  notificationPermission: BrowserNotificationPermissionState;
  onRequestNotifications: () => void;
  focusMode: boolean;
  onToggleFocusMode: () => void;
  hasUnreadOrders?: boolean;
}) {
  return (
    <header className="pos-header">
      <div className="pos-header__lead">
        <h1 className="pos-header__title">
          Order Line
          {hasUnreadOrders ? (
            <span className="pos-queue-pulse" aria-label="Unread orders in queue" />
          ) : null}
        </h1>
        <p className="pos-header__subtitle">
          Active orders and fulfillment — live updates with polling fallback
        </p>
      </div>
      <div className="pos-header__actions">
        <OperationalAttentionToolbar
          muted={muted}
          onToggleMuted={onToggleMuted}
          notificationPermission={notificationPermission}
          onRequestNotifications={onRequestNotifications}
          focusMode={focusMode}
          onToggleFocusMode={onToggleFocusMode}
        />
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
