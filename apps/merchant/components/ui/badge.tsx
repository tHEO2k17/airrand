import type { OrderStatus } from "@airrand/domain";

type BadgeTone = "neutral" | "accent" | "success" | "danger" | "info";

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span className={`pos-badge pos-badge--${tone} ${className}`.trim()}>
      {children}
    </span>
  );
}

const STATUS_TONE: Record<OrderStatus, BadgeTone> = {
  placed: "info",
  accepted: "accent",
  ready: "success",
  picked_up: "neutral",
  cancelled: "danger",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge tone={STATUS_TONE[status]}>
      {status.replace("_", " ")}
    </Badge>
  );
}
