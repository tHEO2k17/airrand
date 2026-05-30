import { Redis } from "ioredis";

export interface RedisCommandClient {
  ping(): Promise<string>;
  incr(key: string): Promise<number>;
  pexpire(key: string, milliseconds: number): Promise<number>;
  quit(): Promise<string>;
}

let sharedClient: Redis | null = null;

export function getRedisUrl(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const url = env.REDIS_URL?.trim();
  return url && url.length > 0 ? url : undefined;
}

export function createRedisClient(url: string): Redis {
  return new Redis(url, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: true,
    lazyConnect: true,
  });
}

export function getRedisClient(env: NodeJS.ProcessEnv = process.env): RedisCommandClient | null {
  const url = getRedisUrl(env);
  if (!url) {
    return null;
  }

  if (!sharedClient) {
    sharedClient = createRedisClient(url);
  }

  return sharedClient;
}

export async function connectRedisClient(
  client: RedisCommandClient,
): Promise<void> {
  const redis = client as Redis;
  if (redis.status === "wait" || redis.status === "end") {
    await redis.connect();
  }
}

export async function pingRedis(
  client: RedisCommandClient,
): Promise<{ ok: boolean; detail?: string }> {
  try {
    await connectRedisClient(client);
    const response = await client.ping();
    if (response !== "PONG") {
      return { ok: false, detail: `Unexpected PING response: ${response}` };
    }
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Redis error";
    return { ok: false, detail: message };
  }
}

/** @internal Test-only */
export async function closeRedisClientForTests(): Promise<void> {
  if (sharedClient) {
    await sharedClient.quit();
    sharedClient = null;
  }
}

/** @internal Test-only */
export function resetRedisClientForTests(): void {
  sharedClient = null;
}
