import { describe, expect, it } from "vitest";
import { getMerchantStorefrontPath, getMerchantStorefrontUrl } from "./storefront.js";

describe("merchant storefront helpers", () => {
  it("builds storefront path from slug", () => {
    expect(getMerchantStorefrontPath("Kofi-Mart")).toBe("/store/kofi-mart");
  });

  it("builds absolute storefront URL with configured origin", () => {
    expect(getMerchantStorefrontUrl("demo-cafe")).toContain("/store/demo-cafe");
  });
});
