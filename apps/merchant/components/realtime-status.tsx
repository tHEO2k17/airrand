import type { RealtimeConnectionStatus } from "../lib/use-merchant-realtime";

const LABELS: Record<RealtimeConnectionStatus, string> = {
  live: "Live",
  reconnecting: "Reconnecting",
  polling: "Polling fallback",
};

export function RealtimeStatus({
  status,
}: {
  status: RealtimeConnectionStatus;
}) {
  return (
    <span className={`realtime-status realtime-status--${status}`}>
      {LABELS[status]}
    </span>
  );
}
