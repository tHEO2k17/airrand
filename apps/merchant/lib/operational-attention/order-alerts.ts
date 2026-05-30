import type { RealtimeEventType } from "@airrand/contracts";
import type { ParsedRealtimeEvent } from "./parse-realtime-event";

export function shouldPlaySoundForRealtimeEvent(
  event: Pick<ParsedRealtimeEvent, "type">,
): boolean {
  return event.type === "order.created";
}

export function shouldNotifyForRealtimeEvent(
  event: Pick<ParsedRealtimeEvent, "type" | "order">,
  options?: { notifyOnReady?: boolean },
): boolean {
  if (event.type === "order.created") {
    return true;
  }

  if (
    options?.notifyOnReady &&
    event.type === "order.status_changed" &&
    event.order?.status === "ready"
  ) {
    return true;
  }

  return false;
}

export function notificationTitleForEvent(
  event: Pick<ParsedRealtimeEvent, "type" | "order">,
): string {
  if (event.type === "order.created") {
    return `New order ${event.order?.reference ?? ""}`.trim();
  }

  if (event.order?.status === "ready") {
    return `Ready for pickup · ${event.order.reference}`;
  }

  return "Order update";
}

export function notificationBodyForEvent(
  event: Pick<ParsedRealtimeEvent, "type" | "order">,
): string {
  if (event.type === "order.created") {
    const name = event.order?.customerName ?? "Guest";
    return `${name} — review the order queue`;
  }

  if (event.order?.status === "ready") {
    return `${event.order.reference} is ready for customer pickup`;
  }

  return "Open the order line to view details";
}

export function isOrderCreatedEventType(type: RealtimeEventType): boolean {
  return type === "order.created";
}
