import type { OrderStatus } from "@airrand/domain";

export function StatusPill({ status }: { status: OrderStatus }) {
  return <span className={`status-pill status-${status}`}>{status.replace("_", " ")}</span>;
}
