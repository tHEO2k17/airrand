import { describe, expect, it } from "vitest";
import {
  shouldNotifyForRealtimeEvent,
  shouldPlaySoundForRealtimeEvent,
} from "./order-alerts.js";

describe("order alerts", () => {
  it("plays sound only for order.created", () => {
    expect(shouldPlaySoundForRealtimeEvent({ type: "order.created" })).toBe(true);
    expect(
      shouldPlaySoundForRealtimeEvent({ type: "order.status_changed" }),
    ).toBe(false);
  });

  it("notifies for new orders and optional ready status", () => {
    expect(
      shouldNotifyForRealtimeEvent({ type: "order.created", order: undefined }),
    ).toBe(true);

    expect(
      shouldNotifyForRealtimeEvent(
        {
          type: "order.status_changed",
          order: {
            id: "1",
            reference: "ORD-1",
            status: "ready",
          } as never,
        },
        { notifyOnReady: true },
      ),
    ).toBe(true);

    expect(
      shouldNotifyForRealtimeEvent(
        {
          type: "order.status_changed",
          order: {
            id: "1",
            reference: "ORD-1",
            status: "accepted",
          } as never,
        },
        { notifyOnReady: true },
      ),
    ).toBe(false);
  });
});
