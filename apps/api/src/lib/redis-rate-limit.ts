import type { RedisCommandClient } from "./redis-client.js";
import type { RateLimitBucket, RateLimitConfig } from "./rate-limit.js";

export function buildRateLimitRedisKey(
  bucket: RateLimitBucket,
  clientKey: string,
  windowId: number,
): string {
  return `airrand:rl:${bucket}:${clientKey}:${windowId}`;
}

export function getRateLimitWindowId(nowMs: number, windowMs: number): number {
  return Math.floor(nowMs / windowMs);
}

export async function consumeRedisRateLimit(
  redis: RedisCommandClient,
  clientKey: string,
  bucket: RateLimitBucket,
  config: RateLimitConfig,
  nowMs: number = Date.now(),
): Promise<boolean> {
  const limit = bucket === "mutation" ? config.maxMutations : config.maxReads;
  const windowId = getRateLimitWindowId(nowMs, config.windowMs);
  const key = buildRateLimitRedisKey(bucket, clientKey, windowId);

  const count = await redis.incr(key);
  if (count === 1) {
    await redis.pexpire(key, config.windowMs);
  }

  return count <= limit;
}
