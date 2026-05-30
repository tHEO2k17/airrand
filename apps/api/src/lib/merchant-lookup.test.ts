import { describe, expect, it } from "vitest";
import { normalizeMerchantSlug } from "@airrand/domain";

describe("merchant slug lookup input", () => {
  it("normalizes slug before lookup", () => {
    expect(normalizeMerchantSlug("Kofi-Mart")).toBe("kofi-mart");
  });
});
