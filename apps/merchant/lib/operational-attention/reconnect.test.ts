import { describe, expect, it } from "vitest";
import { collectOrderIds } from "./new-order-detection.js";

describe("reconnect handling", () => {
  it("merges baseline ids without treating reconnect snapshot as new", () => {
    const baseline = collectOrderIds([
      { id: "order-1" } as never,
    ]);
    const afterReconnect = collectOrderIds([
      { id: "order-1" } as never,
      { id: "order-2" } as never,
    ]);

    const merged = new Set(baseline);
    for (const id of afterReconnect) {
      merged.add(id);
    }

    expect([...merged]).toEqual(["order-1", "order-2"]);
    expect(baseline.has("order-2")).toBe(false);
  });
});
