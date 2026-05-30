import type { RealtimeEventType } from "@airrand/contracts";
import type { OrderResponse } from "@airrand/contracts";

export interface ParsedRealtimeEvent {
  id: string;
  type: RealtimeEventType;
  merchantId: string;
  orderId?: string;
  timestamp: string;
  order?: OrderResponse;
  previousStatus?: string;
}

export function parseRealtimeEventMessage(
  data: string,
): ParsedRealtimeEvent | null {
  try {
    const envelope = JSON.parse(data) as {
      id?: string;
      type?: RealtimeEventType;
      merchantId?: string;
      orderId?: string;
      timestamp?: string;
      data?: { order?: OrderResponse };
    };

    if (
      !envelope.id ||
      !envelope.type ||
      !envelope.merchantId ||
      !envelope.timestamp
    ) {
      return null;
    }

    return {
      id: envelope.id,
      type: envelope.type,
      merchantId: envelope.merchantId,
      orderId: envelope.orderId,
      timestamp: envelope.timestamp,
      order: envelope.data?.order,
    };
  } catch {
    return null;
  }
}
