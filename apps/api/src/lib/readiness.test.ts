import { describe, expect, it } from "vitest";
import { aggregateReadiness } from "./readiness.js";

describe("aggregateReadiness", () => {
  it("requires database, secrets, and storage", () => {
    expect(aggregateReadiness("ok", "skipped", "ok", "ok")).toBe(true);
    expect(aggregateReadiness("failed", "ok", "ok", "ok")).toBe(false);
    expect(aggregateReadiness("ok", "ok", "failed", "ok")).toBe(false);
    expect(aggregateReadiness("ok", "ok", "ok", "failed")).toBe(false);
  });

  it("fails when redis is failed", () => {
    expect(aggregateReadiness("ok", "failed", "ok", "ok")).toBe(false);
  });

  it("allows skipped redis", () => {
    expect(aggregateReadiness("ok", "skipped", "ok", "ok")).toBe(true);
  });
});
