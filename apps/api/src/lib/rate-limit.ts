export interface RateLimitConfig {
  windowMs: number;
  maxReads: number;
  maxMutations: number;
}

export interface WindowEntry {
  count: number;
  windowStartMs: number;
}

export type RateLimitBucket = "read" | "mutation";

export function parseRateLimitConfig(env: NodeJS.ProcessEnv = process.env): RateLimitConfig {
  return {
    windowMs: parsePositiveInt(env.RATE_LIMIT_WINDOW_MS, 60_000),
    maxReads: parsePositiveInt(env.RATE_LIMIT_MAX_READS, 120),
    maxMutations: parsePositiveInt(env.RATE_LIMIT_MAX_MUTATIONS, 30),
  };
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

export function isMutationMethod(method: string): boolean {
  return method === "POST" || method === "PATCH" || method === "PUT" || method === "DELETE";
}

export function consumeRateLimit(
  buckets: Map<string, WindowEntry>,
  key: string,
  bucket: RateLimitBucket,
  config: RateLimitConfig,
  nowMs: number = Date.now(),
): boolean {
  const limit = bucket === "mutation" ? config.maxMutations : config.maxReads;
  const entry = buckets.get(key);

  if (!entry || nowMs - entry.windowStartMs >= config.windowMs) {
    buckets.set(key, { count: 1, windowStartMs: nowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count += 1;
  buckets.set(key, entry);
  return true;
}

export class InMemoryRateLimiter {
  private readonly readBuckets = new Map<string, WindowEntry>();
  private readonly mutationBuckets = new Map<string, WindowEntry>();

  check(key: string, bucket: RateLimitBucket, config: RateLimitConfig, nowMs?: number): boolean {
    const map = bucket === "mutation" ? this.mutationBuckets : this.readBuckets;
    return consumeRateLimit(map, key, bucket, config, nowMs);
  }

  reset(): void {
    this.readBuckets.clear();
    this.mutationBuckets.clear();
  }
}
