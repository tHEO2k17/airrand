import { describe, expect, it } from "vitest";
import {
  consumeRateLimit,
  InMemoryRateLimiter,
  isMutationMethod,
} from "./rate-limit.js";

describe("isMutationMethod", () => {
  it("treats POST and PATCH as mutations", () => {
    expect(isMutationMethod("POST")).toBe(true);
    expect(isMutationMethod("PATCH")).toBe(true);
    expect(isMutationMethod("GET")).toBe(false);
  });
});

describe("consumeRateLimit", () => {
  it("allows requests within the window limit", () => {
    const buckets = new Map();
    const config = { windowMs: 60_000, maxReads: 2, maxMutations: 1 };

    expect(consumeRateLimit(buckets, "1.2.3.4", "read", config, 1000)).toBe(true);
    expect(consumeRateLimit(buckets, "1.2.3.4", "read", config, 2000)).toBe(true);
    expect(consumeRateLimit(buckets, "1.2.3.4", "read", config, 3000)).toBe(false);
  });

  it("resets the window after windowMs elapses", () => {
    const buckets = new Map();
    const config = { windowMs: 1000, maxReads: 1, maxMutations: 1 };

    expect(consumeRateLimit(buckets, "ip", "read", config, 0)).toBe(true);
    expect(consumeRateLimit(buckets, "ip", "read", config, 500)).toBe(false);
    expect(consumeRateLimit(buckets, "ip", "read", config, 1500)).toBe(true);
  });

  it("tracks read and mutation buckets separately", () => {
    const limiter = new InMemoryRateLimiter();
    const config = { windowMs: 60_000, maxReads: 1, maxMutations: 1 };

    expect(limiter.check("ip", "read", config, 100)).toBe(true);
    expect(limiter.check("ip", "read", config, 200)).toBe(false);
    expect(limiter.check("ip", "mutation", config, 300)).toBe(true);
    expect(limiter.check("ip", "mutation", config, 400)).toBe(false);
  });
});
