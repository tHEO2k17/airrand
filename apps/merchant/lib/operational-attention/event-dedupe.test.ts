import { describe, expect, it } from "vitest";
import {
  hasProcessedEventId,
  registerProcessedEventId,
} from "./event-dedupe.js";

describe("event dedupe", () => {
  it("detects processed event ids", () => {
    const ids = new Set(["evt-1"]);
    expect(hasProcessedEventId(ids, "evt-1")).toBe(true);
    expect(hasProcessedEventId(ids, "evt-2")).toBe(false);
  });

  it("registers new event ids", () => {
    const next = registerProcessedEventId(new Set(), "evt-1");
    expect(next.has("evt-1")).toBe(true);
  });
});
