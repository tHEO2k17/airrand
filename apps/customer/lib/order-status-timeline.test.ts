import { describe, expect, it } from "vitest";
import {
  buildOrderStatusTimeline,
  isTerminalOrderStatus,
} from "./order-status-timeline.js";

describe("buildOrderStatusTimeline", () => {
  it("marks earlier steps complete and current step as current", () => {
    const steps = buildOrderStatusTimeline("ready");
    expect(steps.map((s) => s.state)).toEqual([
      "complete",
      "complete",
      "current",
      "upcoming",
    ]);
  });

  it("marks all steps complete when picked up", () => {
    const steps = buildOrderStatusTimeline("picked_up");
    expect(steps.every((s) => s.state === "complete")).toBe(true);
  });

  it("marks cancelled on first step when order is cancelled", () => {
    const steps = buildOrderStatusTimeline("cancelled");
    expect(steps[0]?.state).toBe("cancelled");
  });
});

describe("isTerminalOrderStatus", () => {
  it("returns true for picked_up and cancelled", () => {
    expect(isTerminalOrderStatus("picked_up")).toBe(true);
    expect(isTerminalOrderStatus("cancelled")).toBe(true);
    expect(isTerminalOrderStatus("ready")).toBe(false);
  });
});
