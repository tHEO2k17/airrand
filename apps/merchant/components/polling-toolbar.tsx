import { Button } from "./ui/button";
import { formatDateTime } from "../lib/format";
import type { RealtimeConnectionStatus } from "../lib/use-merchant-realtime";
import { RealtimeStatus } from "./realtime-status";

export function PollingToolbar({
  lastUpdated,
  onRefresh,
  refreshing = false,
  connectionStatus,
}: {
  lastUpdated: Date | null;
  onRefresh: () => void;
  refreshing?: boolean;
  connectionStatus?: RealtimeConnectionStatus;
}) {
  return (
    <div className="polling-toolbar">
      <span className="pos-muted polling-toolbar__meta">
        {connectionStatus ? <RealtimeStatus status={connectionStatus} /> : null}
        {lastUpdated
          ? `Last updated ${formatDateTime(lastUpdated.toISOString())}`
          : "Waiting for first load…"}
      </span>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={onRefresh}
        disabled={refreshing}
      >
        {refreshing ? "Refreshing…" : "Refresh"}
      </Button>
    </div>
  );
}
