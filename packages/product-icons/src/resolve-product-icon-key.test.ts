import { describe, expect, it } from "vitest";
import { resolveProductIconKey } from "./resolve-product-icon-key.js";

describe("resolveProductIconKey", () => {
  it("maps drink keywords to cup", () => {
    expect(
      resolveProductIconKey({ productName: "Cold Brew", categoryName: "Drinks" }),
    ).toBe("cup");
  });

  it("maps medicine keywords to pill", () => {
    expect(
      resolveProductIconKey({
        productName: "Pain Relief Tablets",
        categoryName: "OTC / Wellness",
      }),
    ).toBe("pill");
  });

  it("uses category iconKey when name is ambiguous", () => {
    expect(
      resolveProductIconKey({
        productName: "House Blend",
        categoryIconKey: "cup",
      }),
    ).toBe("cup");
  });

  it("maps laundry category name to shirt", () => {
    expect(
      resolveProductIconKey({
        productName: "Express wash",
        categoryName: "Laundry Services",
      }),
    ).toBe("shirt");
  });

  it("maps groceries keywords to basket", () => {
    expect(
      resolveProductIconKey({
        productName: "Fresh vegetables",
        categoryName: "Groceries",
      }),
    ).toBe("basket");
  });

  it("maps electronics keywords to smartphone", () => {
    expect(
      resolveProductIconKey({
        productName: "USB-C charger",
        categoryName: "Electronics",
      }),
    ).toBe("smartphone");
  });

  it("maps beauty keywords to scissors", () => {
    expect(
      resolveProductIconKey({
        productName: "Haircut voucher",
        categoryName: "Beauty",
      }),
    ).toBe("scissors");
  });

  it("maps capsule keyword to pill", () => {
    expect(
      resolveProductIconKey({ productName: "Vitamin capsule pack" }),
    ).toBe("pill");
  });

  it("falls back to generic", () => {
    expect(
      resolveProductIconKey({ productName: "Misc item", categoryName: "General" }),
    ).toBe("generic");
  });

  it("prefers keyword match over category iconKey", () => {
    expect(
      resolveProductIconKey({
        productName: "Espresso",
        categoryIconKey: "cookie",
      }),
    ).toBe("cup");
  });
});
