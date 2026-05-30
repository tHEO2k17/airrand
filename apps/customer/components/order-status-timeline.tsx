import type { OrderTimelineStep } from "../lib/order-status-timeline";

export function OrderStatusTimeline({ steps }: { steps: OrderTimelineStep[] }) {
  return (
    <ol className="store-timeline" aria-label="Order progress">
      {steps.map((step) => (
        <li
          key={step.status}
          className={`store-timeline__step store-timeline__step--${step.state}`}
        >
          <span className="store-timeline__marker" aria-hidden />
          <span className="store-timeline__label">{step.label}</span>
        </li>
      ))}
    </ol>
  );
}
