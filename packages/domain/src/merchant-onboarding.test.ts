import { describe, expect, it } from "vitest";
import {
  validateMerchantOnboardInput,
  validateMerchantSettingsSlug,
} from "./merchant-onboarding.js";

describe("validateMerchantOnboardInput", () => {
  it("accepts valid onboarding input", () => {
    const result = validateMerchantOnboardInput({
      merchantName: "Sky Lounge",
      slug: "Sky-Lounge",
      ownerEmail: "owner@sky.test",
    });
    expect(result).toEqual({
      ok: true,
      slug: "sky-lounge",
      ownerEmail: "owner@sky.test",
    });
  });

  it("rejects invalid slug format", () => {
    const result = validateMerchantOnboardInput({
      merchantName: "Sky Lounge",
      slug: "sky_lounge",
      ownerEmail: "owner@sky.test",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === "slug")).toBe(true);
    }
  });

  it("rejects empty merchant name", () => {
    const result = validateMerchantOnboardInput({
      merchantName: "   ",
      slug: "sky-lounge",
      ownerEmail: "owner@sky.test",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === "merchantName")).toBe(true);
    }
  });
});

describe("validateMerchantSettingsSlug", () => {
  it("returns null for valid slugs", () => {
    expect(validateMerchantSettingsSlug("demo-cafe")).toBeNull();
  });

  it("returns message for invalid slugs", () => {
    expect(validateMerchantSettingsSlug("Demo Cafe")).toMatch(/lowercase/);
  });
});
