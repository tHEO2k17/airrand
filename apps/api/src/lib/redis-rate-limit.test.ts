import { describe, expect, it } from "vitest";
import {
  buildRateLimitRedisKey,
  consumeRedisRateLimit,
  getRateLimitWindowId,
} from "./redis-rate-limit.js";
import type { RedisCommandClient } from "./redis-client.js";

function createMockRedis(): RedisCommandClient & { store: Map<string, number> } {
  const store = new Map<string, number>();
  return {
    store,
    async ping() {
      return "PONG";
    },
    async incr(key: string) {
      const next = (store.get(key) ?? 0) + 1;
      store.set(key, next);
      return next;
    },
    async pexpire() {
      return 1;
    },
    async get() {
      return null;
    },
    async set() {
      return "OK";
    },
    async del() {
      return 0;
    },
    async quit() {
      return "OK";
    },
  };
}

describe("redis rate limit", () => {
  it("builds stable keys per bucket, client, and window", () => {
    expect(buildRateLimitRedisKey("read", "1.2.3.4", 42)).toBe(
      "airrand:rl:read:1.2.3.4:42",
    );
    expect(getRateLimitWindowId(125_000, 60_000)).toBe(2);
  });

  it("allows requests within the fixed window limit", async () => {
    const redis = createMockRedis();
    const config = { windowMs: 60_000, maxReads: 2, maxMutations: 1 };

    expect(
      await consumeRedisRateLimit(redis, "ip", "read", config, 1000),
    ).toBe(true);
    expect(
      await consumeRedisRateLimit(redis, "ip", "read", config, 2000),
    ).toBe(true);
    expect(
      await consumeRedisRateLimit(redis, "ip", "read", config, 3000),
    ).toBe(false);
  });

  it("tracks read and mutation buckets separately", async () => {
    const redis = createMockRedis();
    const config = { windowMs: 60_000, maxReads: 1, maxMutations: 1 };

    expect(
      await consumeRedisRateLimit(redis, "ip", "read", config, 100),
    ).toBe(true);
    expect(
      await consumeRedisRateLimit(redis, "ip", "read", config, 200),
    ).toBe(false);
    expect(
      await consumeRedisRateLimit(redis, "ip", "mutation", config, 300),
    ).toBe(true);
  });
});
