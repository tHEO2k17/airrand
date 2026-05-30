import type { Merchant } from "@airrand/database";
import { describe, expect, it, vi } from "vitest";
import { listMerchantsHandler } from "./list-merchants.handler.js";
import type { MerchantsRepository } from "../../repositories/merchants.repository.js";

function merchant(overrides: Partial<Merchant> = {}): Merchant {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Kofi Mart",
    slug: "kofi-mart",
    description: "Neighborhood shop",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    ...overrides,
  };
}

describe("listMerchantsHandler", () => {
  it("returns merchants mapped to contract responses", async () => {
    const merchantsRepository: MerchantsRepository = {
      listOrderedByName: vi.fn().mockResolvedValue([merchant()]),
      findById: vi.fn(),
      findBySlug: vi.fn(),
    };

    const result = await listMerchantsHandler({ merchantsRepository });

    expect(merchantsRepository.listOrderedByName).toHaveBeenCalledOnce();
    expect(result.merchants).toEqual([
      {
        id: "11111111-1111-1111-1111-111111111111",
        name: "Kofi Mart",
        slug: "kofi-mart",
        description: "Neighborhood shop",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
    ]);
  });
});
