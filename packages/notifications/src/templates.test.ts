import { describe, expect, it } from "vitest";
import {
  NOTIFICATION_UI_COPY,
  NOTIFICATION_TEMPLATE_COPY,
  renderNotificationTemplate,
} from "./templates.js";
import { NOTIFICATION_TYPES } from "./types.js";

describe("notification templates", () => {
  it("uses short operational UI copy", () => {
    expect(NOTIFICATION_UI_COPY.orderReadyQueued).toMatch(/queued/i);
    expect(NOTIFICATION_UI_COPY.orderReadyQueued.length).toBeLessThan(80);
  });

  it("renders order ready SMS copy with reference", () => {
    const body = renderNotificationTemplate(
      NOTIFICATION_TYPES.ORDER_READY_FOR_PICKUP,
      {
        merchantId: "11111111-1111-1111-1111-111111111111",
        orderId: "22222222-2222-2222-2222-222222222222",
        orderReference: "ORD-1001",
      },
      { merchantName: "Demo Cafe" },
    );

    expect(body).toContain("ORD-1001");
    expect(body).toContain("ready for pickup");
    expect(body).not.toMatch(/pay|wallet|balance/i);
  });

  it("renders staff reset email copy without payment language", () => {
    const body = NOTIFICATION_TEMPLATE_COPY.staff_password_reset({
      merchantId: "11111111-1111-1111-1111-111111111111",
      merchantUserId: "22222222-2222-2222-2222-222222222222",
      email: "staff@demo-cafe.test",
    });

    expect(body).toContain("staff@demo-cafe.test");
    expect(body).not.toMatch(/pay|wallet|balance/i);
  });
});
