import { describe, expect, it } from "vitest";
import {
  formatOrderReference,
  isValidOrderReference,
  normalizeOrderReferenceQuery,
  parseOrderReference,
} from "./order-reference.js";

describe("formatOrderReference", () => {
  it("formats predictable ORD references", () => {
    expect(formatOrderReference(1001)).toBe("ORD-1001");
    expect(formatOrderReference(1002)).toBe("ORD-1002");
  });

  it("rejects invalid sequence numbers", () => {
    expect(() => formatOrderReference(0)).toThrow();
    expect(() => formatOrderReference(1.5)).toThrow();
  });
});

describe("parseOrderReference", () => {
  it("parses valid references case-insensitively", () => {
    expect(parseOrderReference("ord-1001")).toBe(1001);
    expect(parseOrderReference("ORD-1002")).toBe(1002);
  });

  it("returns null for invalid references", () => {
    expect(parseOrderReference("ORD-abc")).toBeNull();
    expect(parseOrderReference("1001")).toBeNull();
  });
});

describe("normalizeOrderReferenceQuery", () => {
  it("normalizes numeric-only search to ORD prefix", () => {
    expect(normalizeOrderReferenceQuery("1001")).toBe("ORD-1001");
    expect(normalizeOrderReferenceQuery("ord-1002")).toBe("ORD-1002");
  });
});

describe("isValidOrderReference", () => {
  it("validates reference format", () => {
    expect(isValidOrderReference("ORD-1001")).toBe(true);
    expect(isValidOrderReference("uuid")).toBe(false);
  });
});
