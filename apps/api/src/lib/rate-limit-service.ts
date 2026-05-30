import {
  connectRedisClient,
  getRedisClient,
  type RedisCommandClient,
} from "./redis-client.js";
import {
  InMemoryRateLimiter,
  parseRateLimitConfig,
  type RateLimitBucket,
  type RateLimitConfig,
} from "./rate-limit.js";
import { consumeRedisRateLimit } from "./redis-rate-limit.js";

export type RateLimitBackend = "redis" | "memory";

export interface RateLimitCheckResult {
  allowed: boolean;
  backend: RateLimitBackend;
}

let fallbackWarned = false;
let activeBackend: RateLimitBackend = "memory";

const memoryLimiter = new InMemoryRateLimiter();
const config = parseRateLimitConfig();

function logFallback(reason: string): void {
  if (fallbackWarned) {
    return;
  }
  fallbackWarned = true;
  console.warn(
    JSON.stringify({
      level: "warn",
      type: "rate_limit_fallback",
      message:
        "Redis unavailable or not configured; using in-memory rate limits per API process",
      reason,
      timestamp: new Date().toISOString(),
    }),
  );
}

async function getConnectedRedis(): Promise<RedisCommandClient | null> {
  const client = getRedisClient();
  if (!client) {
    return null;
  }

  try {
    await connectRedisClient(client);
    await client.ping();
    return client;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Redis connection failed";
    logFallback(message);
    return null;
  }
}

export async function checkRateLimit(
  clientKey: string,
  bucket: RateLimitBucket,
  nowMs: number = Date.now(),
): Promise<RateLimitCheckResult> {
  const redis = await getConnectedRedis();
  if (redis) {
    try {
      const allowed = await consumeRedisRateLimit(
        redis,
        clientKey,
        bucket,
        config,
        nowMs,
      );
      activeBackend = "redis";
      return { allowed, backend: "redis" };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Redis rate limit failed";
      logFallback(message);
    }
  } else if (process.env.REDIS_URL?.trim()) {
    logFallback("REDIS_URL is set but client could not connect");
  }

  activeBackend = "memory";
  return {
    allowed: memoryLimiter.check(clientKey, bucket, config, nowMs),
    backend: "memory",
  };
}

export function getActiveRateLimitBackend(): RateLimitBackend {
  return activeBackend;
}

export function getRateLimitConfig(): RateLimitConfig {
  return config;
}

/** @internal Test-only */
export function resetRateLimitServiceForTests(): void {
  memoryLimiter.reset();
  fallbackWarned = false;
  activeBackend = "memory";
}
