export const ORDER_STATUS_TIMELINE_STEPS = [
  { status: "placed", label: "Placed" },
  { status: "accepted", label: "Accepted" },
  { status: "ready", label: "Ready" },
  { status: "picked_up", label: "Picked up" },
] as const;

const STATUS_RANK: Record<string, number> = {
  placed: 0,
  accepted: 1,
  ready: 2,
  picked_up: 3,
};

export type TimelineStepState = "complete" | "current" | "upcoming" | "cancelled";

export interface OrderTimelineStep {
  status: string;
  label: string;
  state: TimelineStepState;
}

export function isTerminalOrderStatus(status: string): boolean {
  return status === "picked_up" || status === "cancelled";
}

export function buildOrderStatusTimeline(currentStatus: string): OrderTimelineStep[] {
  if (currentStatus === "cancelled") {
    return ORDER_STATUS_TIMELINE_STEPS.map((step, index) => ({
      ...step,
      state: index === 0 ? "cancelled" : "upcoming",
    }));
  }

  if (currentStatus === "picked_up") {
    return ORDER_STATUS_TIMELINE_STEPS.map((step) => ({
      ...step,
      state: "complete" as const,
    }));
  }

  const rank = STATUS_RANK[currentStatus] ?? 0;

  return ORDER_STATUS_TIMELINE_STEPS.map((step) => {
    const stepRank = STATUS_RANK[step.status] ?? 0;
    if (stepRank < rank) {
      return { ...step, state: "complete" as const };
    }
    if (stepRank === rank) {
      return { ...step, state: "current" as const };
    }
    return { ...step, state: "upcoming" as const };
  });
}
