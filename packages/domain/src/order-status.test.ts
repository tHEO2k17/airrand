import { describe, expect, it } from "vitest";
import {
  assertCanTransitionOrderStatus,
  canTransitionOrderStatus,
  InvalidOrderStatusTransitionError,
} from "./order-status.js";

describe("canTransitionOrderStatus", () => {
  it("allows valid transitions from placed", () => {
    expect(canTransitionOrderStatus("placed", "accepted")).toBe(true);
    expect(canTransitionOrderStatus("placed", "cancelled")).toBe(true);
  });

  it("allows valid transitions from accepted", () => {
    expect(canTransitionOrderStatus("accepted", "ready")).toBe(true);
    expect(canTransitionOrderStatus("accepted", "cancelled")).toBe(true);
  });

  it("allows valid transitions from ready", () => {
    expect(canTransitionOrderStatus("ready", "picked_up")).toBe(true);
    expect(canTransitionOrderStatus("ready", "cancelled")).toBe(true);
  });

  it("allows same-status (idempotent)", () => {
    expect(canTransitionOrderStatus("ready", "ready")).toBe(true);
  });

  it("rejects invalid transitions from placed", () => {
    expect(canTransitionOrderStatus("placed", "ready")).toBe(false);
    expect(canTransitionOrderStatus("placed", "picked_up")).toBe(false);
  });

  it("rejects invalid transitions from accepted", () => {
    expect(canTransitionOrderStatus("accepted", "picked_up")).toBe(false);
    expect(canTransitionOrderStatus("accepted", "placed")).toBe(false);
  });

  it("rejects transitions from terminal states", () => {
    expect(canTransitionOrderStatus("picked_up", "ready")).toBe(false);
    expect(canTransitionOrderStatus("picked_up", "cancelled")).toBe(false);
    expect(canTransitionOrderStatus("cancelled", "placed")).toBe(false);
    expect(canTransitionOrderStatus("cancelled", "accepted")).toBe(false);
  });
});

describe("assertCanTransitionOrderStatus", () => {
  it("does not throw for valid transitions", () => {
    expect(() => assertCanTransitionOrderStatus("placed", "accepted")).not.toThrow();
  });

  it("throws InvalidOrderStatusTransitionError for invalid transitions", () => {
    expect(() => assertCanTransitionOrderStatus("placed", "ready")).toThrow(
      InvalidOrderStatusTransitionError,
    );
    try {
      assertCanTransitionOrderStatus("picked_up", "ready");
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidOrderStatusTransitionError);
      expect((error as InvalidOrderStatusTransitionError).from).toBe("picked_up");
      expect((error as InvalidOrderStatusTransitionError).to).toBe("ready");
    }
  });
});
