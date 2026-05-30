import { describe, expect, it } from "vitest";
import {
  PICKUP_QR_LOCKED_MESSAGE,
  shouldShowPickupQr,
  shouldShowPickupQrLocked,
} from "./pickup-qr-eligibility.js";

describe("pickup QR eligibility", () => {
  it("shows QR only when order is ready", () => {
    expect(shouldShowPickupQr("ready")).toBe(true);
    expect(shouldShowPickupQr("accepted")).toBe(false);
    expect(shouldShowPickupQr("placed")).toBe(false);
    expect(shouldShowPickupQr("picked_up")).toBe(false);
  });

  it("shows locked placeholder when accepted but not ready", () => {
    expect(shouldShowPickupQrLocked("accepted")).toBe(true);
    expect(shouldShowPickupQrLocked("ready")).toBe(false);
    expect(shouldShowPickupQrLocked("placed")).toBe(false);
  });

  it("uses customer-friendly locked copy", () => {
    expect(PICKUP_QR_LOCKED_MESSAGE).toMatch(/when the merchant marks/i);
  });
});
