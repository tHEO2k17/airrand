import { describe, expect, it } from "vitest";
import { variantByKind } from "./notification-feedback.js";

// Test mapping logic without React DOM — export variant map for test or test via render
// NotificationFeedback is thin; verify kind mapping contract.

const expected = {
  actionSuccess: "success",
  notificationQueued: "info",
  warning: "warning",
  error: "error",
  info: "info",
} as const;

describe("NotificationFeedback kinds", () => {
  it("maps notification kinds to semantic alert variants", () => {
    expect(variantByKind).toEqual(expected);
  });
});
