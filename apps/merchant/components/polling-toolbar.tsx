import { Button } from "./ui/button";
import { formatDateTime } from "../lib/format";

export function PollingToolbar({
  lastUpdated,
  onRefresh,
  refreshing = false,
}: {
  lastUpdated: Date | null;
  onRefresh: () => void;
  refreshing?: boolean;
}) {
  return (
    <div className="polling-toolbar">
      <span className="pos-muted polling-toolbar__meta">
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
