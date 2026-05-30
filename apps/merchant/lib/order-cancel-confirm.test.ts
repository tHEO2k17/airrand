import { describe, expect, it } from "vitest";
import { formatOrderCancelConfirmMessage } from "./order-cancel-confirm.js";

describe("order cancel confirm", () => {
  it("includes the order reference in the confirmation message", () => {
    expect(formatOrderCancelConfirmMessage("ORD-1022")).toContain("ORD-1022");
  });

  it("warns that the customer must reorder", () => {
    expect(formatOrderCancelConfirmMessage("ORD-1022")).toMatch(/place a new order/i);
  });
});
