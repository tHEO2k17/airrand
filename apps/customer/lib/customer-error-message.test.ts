import { describe, expect, it } from "vitest";
import { ApiError } from "./api.js";
import { toCustomerErrorMessage } from "./customer-error-message.js";

describe("toCustomerErrorMessage", () => {
  it("maps order not found without exposing API codes", () => {
    const message = toCustomerErrorMessage(
      new ApiError("ORDER_NOT_FOUND", "Order not found", 404),
    );
    expect(message).toBe(
      "We could not find that order. Check the shop link and order reference.",
    );
    expect(message).not.toContain("ORDER_NOT_FOUND");
  });

  it("maps product unavailable for checkout errors", () => {
    const message = toCustomerErrorMessage(
      new ApiError("PRODUCT_UNAVAILABLE", "Out of stock", 400),
    );
    expect(message).toMatch(/no longer available/i);
  });

  it("falls back for unknown errors", () => {
    expect(toCustomerErrorMessage(new ApiError("UNKNOWN", "x", 500))).toBe(
      "Something went wrong. Please try again.",
    );
  });

  it("passes through generic Error messages", () => {
    expect(toCustomerErrorMessage(new Error("Network offline"))).toBe(
      "Network offline",
    );
  });
});
