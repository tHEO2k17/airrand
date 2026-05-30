import { describe, expect, it } from "vitest";
import { isValidCustomerPhone } from "./customer-contact.js";

describe("isValidCustomerPhone", () => {
  it("accepts common local and international formats", () => {
    expect(isValidCustomerPhone("0244123456")).toBe(true);
    expect(isValidCustomerPhone("+233 24 412 3456")).toBe(true);
    expect(isValidCustomerPhone("+1 (555) 123-4567")).toBe(true);
  });

  it("rejects too-short or non-phone strings", () => {
    expect(isValidCustomerPhone("12345")).toBe(false);
    expect(isValidCustomerPhone("not-a-phone")).toBe(false);
    expect(isValidCustomerPhone("")).toBe(false);
  });
});
