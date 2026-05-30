import { describe, expect, it } from "vitest";
import { isValidMerchantSlug, normalizeMerchantSlug } from "./merchant-slug.js";

describe("merchant slug helpers", () => {
  it("normalizes slug input", () => {
    expect(normalizeMerchantSlug("  Kofi-Mart ")).toBe("kofi-mart");
  });

  it("accepts kebab-case slugs", () => {
    expect(isValidMerchantSlug("demo-cafe")).toBe(true);
    expect(isValidMerchantSlug("campus-bites")).toBe(true);
    expect(isValidMerchantSlug("kofi-mart")).toBe(true);
  });

  it("rejects invalid slugs", () => {
    expect(isValidMerchantSlug("")).toBe(false);
    expect(isValidMerchantSlug("Demo Cafe")).toBe(false);
    expect(isValidMerchantSlug("demo_cafe")).toBe(false);
    expect(isValidMerchantSlug("-demo")).toBe(false);
  });
});
