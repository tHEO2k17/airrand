import { describe, expect, it } from "vitest";
import { createProductSchema } from "./product.js";

describe("createProductSchema", () => {
  it("defaults stock state to in_stock", () => {
    const parsed = createProductSchema.parse({
      name: "Water",
      unitPriceCents: 200,
    });
    expect(parsed.stockState).toBe("in_stock");
  });

  it("rejects negative stock quantity", () => {
    expect(() =>
      createProductSchema.parse({
        name: "Water",
        unitPriceCents: 200,
        stockQuantity: -1,
      }),
    ).toThrow();
  });
});
