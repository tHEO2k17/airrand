import { describe, expect, it } from "vitest";
import { buildOrderReadyForPickupNotification } from "@airrand/notifications";
import { getNotificationJobNameForTests } from "./notification-queue.js";

describe("notification queue helpers", () => {
  it("uses stable notification job name", () => {
    expect(getNotificationJobNameForTests()).toBe("notification.requested");
  });

  it("builds order ready payload for enqueue input", () => {
    const input = buildOrderReadyForPickupNotification({
      merchantId: "11111111-1111-1111-1111-111111111111",
      orderId: "22222222-2222-2222-2222-222222222222",
      orderReference: "ORD-1001",
      customerContact: "0244123456",
    });

    expect(input.payload.orderReference).toBe("ORD-1001");
    expect(input.recipient).toBe("0244123456");
  });
});
