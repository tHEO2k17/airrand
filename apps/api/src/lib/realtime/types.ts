import type { RealtimeEventType } from "@airrand/contracts";

export interface RealtimeEventMessage {
  id: string;
  type: RealtimeEventType;
  merchantId: string;
  orderId?: string;
  productId?: string;
  timestamp: string;
  data: unknown;
}

export type RealtimeListener = (message: RealtimeEventMessage) => void;

export type Unsubscribe = () => void;
