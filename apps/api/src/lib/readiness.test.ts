import { describe, expect, it } from "vitest";
import { aggregateReadiness } from "./readiness.js";

describe("aggregateReadiness", () => {
  it("requires database and secrets to be ok", () => {
    expect(aggregateReadiness("ok", "skipped", "ok")).toBe(true);
    expect(aggregateReadiness("failed", "ok", "ok")).toBe(false);
    expect(aggregateReadiness("ok", "ok", "failed")).toBe(false);
  });

  it("fails when redis check failed", () => {
    expect(aggregateReadiness("ok", "failed", "ok")).toBe(false);
  });

  it("allows skipped redis when other checks pass", () => {
    expect(aggregateReadiness("ok", "skipped", "ok")).toBe(true);
  });
});
