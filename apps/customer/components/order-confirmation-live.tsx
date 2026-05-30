"use client";

import { useEffect, useState } from "react";
import type { StoredOrderConfirmation } from "../lib/order-confirmation";
import { fetchOrderStatus } from "../lib/api";
import {
  isTerminalOrderStatus,
} from "../lib/order-status-timeline";
import { useOrderRealtime } from "../lib/use-order-realtime";
import { StatusBadge } from "./ui/badge";

export function OrderConfirmationLiveStatus({
  confirmation,
}: {
  confirmation: StoredOrderConfirmation;
}) {
  const [status, setStatus] = useState(confirmation.status);

  useEffect(() => {
    setStatus(confirmation.status);
  }, [confirmation.status]);

  const realtimeEnabled = !isTerminalOrderStatus(status);

  useOrderRealtime({
    merchantId: confirmation.merchantId,
    orderId: confirmation.orderId,
    enabled: realtimeEnabled,
    onStatus: (next) => setStatus(next.status),
    onPoll: async () => {
      const next = await fetchOrderStatus(
        confirmation.merchantId,
        confirmation.orderId,
      );
      setStatus(next.status);
    },
  });

  return <StatusBadge status={status} />;
}
