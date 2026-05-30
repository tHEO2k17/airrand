import { describe, expect, it, vi, afterEach } from "vitest";
import { isMerchantSlugTaken } from "./merchant-onboarding.js";
import * as merchantLookup from "./merchant-lookup.js";

vi.mock("./merchant-lookup.js", () => ({
  findMerchantBySlug: vi.fn(),
}));

describe("isMerchantSlugTaken", () => {
  afterEach(() => {
    vi.mocked(merchantLookup.findMerchantBySlug).mockReset();
  });

  it("returns false when slug is unused", async () => {
    vi.mocked(merchantLookup.findMerchantBySlug).mockResolvedValue(null);
    await expect(isMerchantSlugTaken("new-store")).resolves.toBe(false);
  });

  it("returns false when slug belongs to the excluded merchant", async () => {
    vi.mocked(merchantLookup.findMerchantBySlug).mockResolvedValue({
      id: "11111111-1111-1111-1111-111111111111",
      name: "Demo",
      description: null,
      slug: "demo-cafe",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await expect(
      isMerchantSlugTaken("demo-cafe", "11111111-1111-1111-1111-111111111111"),
    ).resolves.toBe(false);
  });

  it("returns true when another merchant owns the slug", async () => {
    vi.mocked(merchantLookup.findMerchantBySlug).mockResolvedValue({
      id: "11111111-1111-1111-1111-111111111111",
      name: "Demo",
      description: null,
      slug: "demo-cafe",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await expect(
      isMerchantSlugTaken("demo-cafe", "22222222-2222-2222-2222-222222222222"),
    ).resolves.toBe(true);
  });
});
