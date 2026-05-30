import { getRequiredRedisUrl } from "@airrand/jobs";
import { Redis } from "ioredis";

export function getBullMqConnectionOptions(): {
  url: string;
  maxRetriesPerRequest: null;
} {
  return {
    url: getRequiredRedisUrl(),
    maxRetriesPerRequest: null,
  };
}

export async function verifyRedisReachable(): Promise<void> {
  const redis = new Redis(getBullMqConnectionOptions());
  try {
    const response = await redis.ping();
    if (response !== "PONG") {
      throw new Error(`Unexpected Redis PING response: ${response}`);
    }
  } finally {
    await redis.quit();
  }
}
