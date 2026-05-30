import type { Context, MiddlewareHandler } from "hono";
import {
  InMemoryRateLimiter,
  isMutationMethod,
  parseRateLimitConfig,
  type RateLimitBucket,
} from "../lib/rate-limit.js";

const limiter = new InMemoryRateLimiter();
const config = parseRateLimitConfig();

export function getClientIp(c: Context): string {
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  const realIp = c.req.header("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return "unknown";
}

export function rateLimitMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    if (c.req.method === "OPTIONS") {
      await next();
      return;
    }

    const bucket: RateLimitBucket = isMutationMethod(c.req.method)
      ? "mutation"
      : "read";
    const ip = getClientIp(c);

    if (!limiter.check(ip, bucket, config)) {
      return c.json(
        {
          error: {
            code: "rate_limited",
            message: "Too many requests. Please try again shortly.",
          },
        },
        429,
      );
    }

    await next();
  };
}

/** @internal Test-only reset */
export function resetRateLimiterForTests(): void {
  limiter.reset();
}
