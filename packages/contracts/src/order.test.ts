import { describe, expect, it } from "vitest";
import { createOrderSchema } from "./order.js";

const validLine = {
  productId: "11111111-1111-1111-1111-111111111111",
  quantity: 1,
};

describe("createOrderSchema", () => {
  it("requires a valid phone number", () => {
    const parsed = createOrderSchema.parse({
      lines: [validLine],
      customerContact: "+233244123456",
    });

    expect(parsed.customerContact).toBe("+233244123456");
  });

  it("allows optional customer name", () => {
    const parsed = createOrderSchema.parse({
      lines: [validLine],
      customerContact: "0244123456",
      customerName: "Ama",
    });

    expect(parsed.customerName).toBe("Ama");
  });

  it("rejects missing or invalid phone", () => {
    expect(() =>
      createOrderSchema.parse({
        lines: [validLine],
      }),
    ).toThrow();

    expect(() =>
      createOrderSchema.parse({
        lines: [validLine],
        customerContact: "abc",
      }),
    ).toThrow();
  });
});
