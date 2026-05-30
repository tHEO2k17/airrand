import { describe, expect, it } from "vitest";
import {
  getOrderActionHint,
  getOrderProgressPercent,
  isActiveOrderStatus,
} from "./order-progress.js";

describe("order progress", () => {
  it("maps status to progress percent", () => {
    expect(getOrderProgressPercent("placed")).toBe(25);
    expect(getOrderProgressPercent("ready")).toBe(75);
    expect(getOrderProgressPercent("picked_up")).toBe(100);
    expect(getOrderProgressPercent("cancelled")).toBe(0);
  });

  it("identifies active orders", () => {
    expect(isActiveOrderStatus("accepted")).toBe(true);
    expect(isActiveOrderStatus("picked_up")).toBe(false);
  });

  it("returns action hints without payment wording", () => {
    expect(getOrderActionHint("ready")).toContain("pickup");
    expect(getOrderActionHint("ready")).not.toMatch(/payment|transaction/i);
  });
});
