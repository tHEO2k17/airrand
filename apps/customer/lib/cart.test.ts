import { describe, expect, it } from "vitest";
import {
  addProductToCart,
  emptyCart,
  getCartItemCount,
  getCartSubtotalCents,
  updateCartItemQuantity,
} from "./cart";

describe("cart helpers", () => {
  const product = {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Espresso",
    unitPriceCents: 350,
  };

  it("adds products and counts quantities", () => {
    const cart = addProductToCart(emptyCart(), product);
    const updated = addProductToCart(cart, product);
    expect(getCartItemCount(updated)).toBe(2);
    expect(getCartSubtotalCents(updated)).toBe(700);
  });

  it("removes items when quantity reaches zero", () => {
    const cart = addProductToCart(emptyCart(), product);
    const cleared = updateCartItemQuantity(cart, product.id, 0);
    expect(cleared.items).toHaveLength(0);
  });
});
