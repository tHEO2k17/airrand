import { describe, expect, it } from "vitest";
import {
  merchantOnboardRequestSchema,
  updateMerchantSettingsSchema,
} from "./onboarding.js";

describe("merchantOnboardRequestSchema", () => {
  it("accepts valid onboarding payload", () => {
    const parsed = merchantOnboardRequestSchema.parse({
      merchantName: "Sky Lounge",
      slug: "sky-lounge",
      description: "Terminal B kiosk",
      ownerEmail: "owner@sky.test",
      ownerDisplayName: "Sky Owner",
    });
    expect(parsed.slug).toBe("sky-lounge");
  });

  it("rejects missing merchant name", () => {
    expect(() =>
      merchantOnboardRequestSchema.parse({
        merchantName: "",
        slug: "sky-lounge",
        ownerEmail: "owner@sky.test",
      }),
    ).toThrow();
  });

  it("rejects invalid owner email", () => {
    expect(() =>
      merchantOnboardRequestSchema.parse({
        merchantName: "Sky Lounge",
        slug: "sky-lounge",
        ownerEmail: "not-an-email",
      }),
    ).toThrow();
  });
});

describe("updateMerchantSettingsSchema", () => {
  it("requires at least one field", () => {
    expect(() => updateMerchantSettingsSchema.parse({})).toThrow();
  });

  it("allows nullable description", () => {
    const parsed = updateMerchantSettingsSchema.parse({
      description: null,
    });
    expect(parsed.description).toBeNull();
  });
});
