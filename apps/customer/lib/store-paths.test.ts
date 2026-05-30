import { describe, expect, it } from "vitest";
import {
  buildStorePath,
  buildStoreTrackingPath,
  buildStoreTrackingUrl,
  parseStoreTrackingReference,
} from "./store-paths";

describe("store paths", () => {
  it("builds storefront paths from slug", () => {
    expect(buildStorePath("Kofi-Mart")).toBe("/store/kofi-mart");
  });

  it("normalizes tracking references in URLs", () => {
    expect(buildStoreTrackingPath("kofi-mart", "1001")).toBe(
      "/store/kofi-mart/track/ORD-1001",
    );
    expect(parseStoreTrackingReference("ORD-1001")).toBe("ORD-1001");
    expect(parseStoreTrackingReference("1001")).toBe("ORD-1001");
  });

  it("builds absolute tracking URLs", () => {
    expect(
      buildStoreTrackingUrl("campus-bites", "ORD-1002", "https://shop.example.com"),
    ).toBe("https://shop.example.com/store/campus-bites/track/ORD-1002");
  });
});
