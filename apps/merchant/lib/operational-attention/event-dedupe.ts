import { PROCESSED_EVENT_IDS_MAX } from "./constants";

export function hasProcessedEventId(
  processedIds: ReadonlySet<string>,
  eventId: string,
): boolean {
  return processedIds.has(eventId);
}

export function registerProcessedEventId(
  processedIds: Set<string>,
  eventId: string,
): Set<string> {
  const next = new Set(processedIds);
  next.add(eventId);
  if (next.size <= PROCESSED_EVENT_IDS_MAX) {
    return next;
  }

  const trimmed = new Set<string>();
  const overflow = next.size - PROCESSED_EVENT_IDS_MAX;
  let index = 0;
  for (const id of next) {
    if (index >= overflow) {
      trimmed.add(id);
    }
    index += 1;
  }
  return trimmed;
}
