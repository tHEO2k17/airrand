import { describe, expect, it } from "vitest";
import { updateProductSchema } from "./product.js";

describe("updateProductSchema", () => {
  it("allows editing name, price, category, and availability", () => {
    const parsed = updateProductSchema.parse({
      name: "Cold Brew",
      unitPriceCents: 550,
      categoryId: "33333333-3333-3333-3333-333333333333",
      isAvailable: false,
    });
    expect(parsed).toMatchObject({
      name: "Cold Brew",
      unitPriceCents: 550,
      isAvailable: false,
    });
  });

  it("allows clearing category assignment", () => {
    const parsed = updateProductSchema.parse({
      categoryId: null,
    });
    expect(parsed.categoryId).toBeNull();
  });

  it("rejects empty patch bodies", () => {
    expect(() => updateProductSchema.parse({})).toThrow();
  });
});
