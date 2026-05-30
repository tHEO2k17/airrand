import type { RealtimeConnectionStatus } from "../lib/use-merchant-realtime";

const LABELS: Record<RealtimeConnectionStatus, string> = {
  live: "Live",
  reconnecting: "Reconnecting",
  polling: "Polling fallback",
};

const HINTS: Record<RealtimeConnectionStatus, string> = {
  live: "Realtime updates connected",
  reconnecting: "Restoring live connection…",
  polling: "Using timed refresh until live returns",
};

export function RealtimeStatus({
  status,
}: {
  status: RealtimeConnectionStatus;
}) {
  return (
    <span
      className={`realtime-status realtime-status--${status}`}
      role="status"
      title={HINTS[status]}
    >
      <span className="realtime-status__dot" aria-hidden />
      {LABELS[status]}
    </span>
  );
}
