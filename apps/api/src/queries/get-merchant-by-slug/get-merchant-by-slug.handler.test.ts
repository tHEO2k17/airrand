import type { Merchant } from "@airrand/database";
import { describe, expect, it, vi } from "vitest";
import { getMerchantBySlugHandler } from "./get-merchant-by-slug.handler.js";
import type { MerchantsRepository } from "../../repositories/merchants.repository.js";

function merchant(overrides: Partial<Merchant> = {}): Merchant {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Kofi Mart",
    slug: "kofi-mart",
    description: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    ...overrides,
  };
}

describe("getMerchantBySlugHandler", () => {
  it("returns not_found when merchant is missing", async () => {
    const merchantsRepository: MerchantsRepository = {
      listOrderedByName: vi.fn(),
      findById: vi.fn(),
      findBySlug: vi.fn().mockResolvedValue(null),
    };

    const result = await getMerchantBySlugHandler(
      { slug: "missing" },
      { merchantsRepository },
    );

    expect(result).toEqual({ kind: "not_found" });
    expect(merchantsRepository.findBySlug).toHaveBeenCalledWith("missing");
  });

  it("returns mapped merchant when found", async () => {
    const merchantsRepository: MerchantsRepository = {
      listOrderedByName: vi.fn(),
      findById: vi.fn(),
      findBySlug: vi.fn().mockResolvedValue(merchant()),
    };

    const result = await getMerchantBySlugHandler(
      { slug: "kofi-mart" },
      { merchantsRepository },
    );

    expect(result).toEqual({
      kind: "ok",
      merchant: {
        id: "11111111-1111-1111-1111-111111111111",
        name: "Kofi Mart",
        slug: "kofi-mart",
        description: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
    });
  });
});
