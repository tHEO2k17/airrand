import { describe, expect, it } from "vitest";
import { resolveTrackOrderLookup } from "./track-order-lookup.js";

describe("resolveTrackOrderLookup", () => {
  it("builds tracking path from shop link name and normalized reference", () => {
    const result = resolveTrackOrderLookup("Kofi-Mart", "1022");
    expect(result).toEqual({
      ok: true,
      path: "/store/kofi-mart/track/ORD-1022",
    });
  });

  it("accepts ord- prefix references", () => {
    const result = resolveTrackOrderLookup("campus-bites", "ord-1022");
    expect(result).toEqual({
      ok: true,
      path: "/store/campus-bites/track/ORD-1022",
    });
  });

  it("accepts ORD- prefix references", () => {
    const result = resolveTrackOrderLookup("kofi-mart", "ORD-1022");
    expect(result).toEqual({
      ok: true,
      path: "/store/kofi-mart/track/ORD-1022",
    });
  });

  it("rejects empty shop link name", () => {
    const result = resolveTrackOrderLookup("  ", "ORD-1022");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/shop link name/i);
    }
  });

  it("rejects empty reference", () => {
    const result = resolveTrackOrderLookup("kofi-mart", "   ");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/reference/i);
    }
  });

  it("rejects invalid reference format", () => {
    const result = resolveTrackOrderLookup("kofi-mart", "not-a-ref");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/invalid/i);
    }
  });
});
