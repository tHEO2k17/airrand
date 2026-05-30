import { describe, expect, it } from "vitest";
import {
  buildRealtimeEvent,
  publishRealtimeEvent,
  resetRealtimeBusForTests,
  subscribeRealtimeEvents,
} from "./event-bus.js";

describe("in-memory realtime bus", () => {
  it("delivers published events to subscribers", async () => {
    resetRealtimeBusForTests();

    const channel = "airrand:rt:test:merchant";
    const received: string[] = [];

    const unsubscribe = subscribeRealtimeEvents(channel, (message) => {
      received.push(message.type);
    });

    await publishRealtimeEvent(
      channel,
      buildRealtimeEvent({
        type: "order.created",
        merchantId: "11111111-1111-1111-1111-111111111111",
        data: { order: { id: "order-1" } },
      }),
    );

    expect(received).toEqual(["order.created"]);
    unsubscribe();
    resetRealtimeBusForTests();
  });
});
