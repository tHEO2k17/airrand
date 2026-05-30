import { randomUUID } from "node:crypto";
import { Redis } from "ioredis";
import { connectRedisClient, getRedisUrl } from "../redis-client.js";
import type { RealtimeEventMessage, RealtimeListener, Unsubscribe } from "./types.js";

const localListeners = new Map<string, Set<RealtimeListener>>();

let redisPublisher: Redis | null = null;
let redisSubscriber: Redis | null = null;
let redisBridgeReady = false;
let fallbackWarned = false;

function logInMemoryFallback(reason: string): void {
  if (fallbackWarned) {
    return;
  }
  fallbackWarned = true;
  console.warn(
    JSON.stringify({
      level: "warn",
      type: "realtime_fallback",
      message:
        "Redis unavailable or not configured; using in-memory realtime bus per API process",
      reason,
      timestamp: new Date().toISOString(),
    }),
  );
}

function dispatchLocal(channel: string, message: RealtimeEventMessage): void {
  const listeners = localListeners.get(channel);
  if (!listeners) {
    return;
  }
  for (const listener of listeners) {
    listener(message);
  }
}

async function ensureRedisBridge(): Promise<boolean> {
  const url = getRedisUrl();
  if (!url) {
    return false;
  }

  if (redisBridgeReady && redisPublisher && redisSubscriber) {
    return true;
  }

  try {
    if (!redisPublisher) {
      redisPublisher = new Redis(url, {
        maxRetriesPerRequest: 1,
        lazyConnect: true,
      });
    }
    if (!redisSubscriber) {
      redisSubscriber = new Redis(url, {
        maxRetriesPerRequest: 1,
        lazyConnect: true,
      });
    }

    await connectRedisClient(redisPublisher);
    await connectRedisClient(redisSubscriber);

    if (!redisBridgeReady) {
      redisSubscriber.on("message", (channel, payload) => {
        try {
          const message = JSON.parse(payload) as RealtimeEventMessage;
          dispatchLocal(channel, message);
        } catch (error) {
          console.error("Realtime Redis message parse failed:", error);
        }
      });
      redisBridgeReady = true;
    }

    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Redis realtime bridge failed";
    logInMemoryFallback(message);
    return false;
  }
}

export async function publishRealtimeEvent(
  channel: string,
  message: RealtimeEventMessage,
): Promise<void> {
  dispatchLocal(channel, message);

  const redisReady = await ensureRedisBridge();
  if (redisReady && redisPublisher) {
    try {
      await redisPublisher.publish(channel, JSON.stringify(message));
      return;
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : "Redis publish failed";
      logInMemoryFallback(messageText);
    }
  } else if (process.env.REDIS_URL?.trim()) {
    logInMemoryFallback("REDIS_URL is set but realtime bridge could not connect");
  }
}

export function subscribeRealtimeEvents(
  channel: string,
  listener: RealtimeListener,
): Unsubscribe {
  if (!localListeners.has(channel)) {
    localListeners.set(channel, new Set());
  }
  localListeners.get(channel)!.add(listener);

  void ensureRedisBridge().then((ready) => {
    if (ready && redisSubscriber) {
      void redisSubscriber.subscribe(channel).catch((error) => {
        console.error("Realtime Redis subscribe failed:", error);
      });
    }
  });

  return () => {
    localListeners.get(channel)?.delete(listener);
    if (localListeners.get(channel)?.size === 0) {
      localListeners.delete(channel);
      if (redisSubscriber) {
        void redisSubscriber.unsubscribe(channel).catch(() => undefined);
      }
    }
  };
}

export function buildRealtimeEvent(
  input: Omit<RealtimeEventMessage, "id" | "timestamp"> & { id?: string; timestamp?: string },
): RealtimeEventMessage {
  return {
    id: input.id ?? randomUUID(),
    timestamp: input.timestamp ?? new Date().toISOString(),
    type: input.type,
    merchantId: input.merchantId,
    orderId: input.orderId,
    productId: input.productId,
    data: input.data,
  };
}

/** @internal Test-only */
export function resetRealtimeBusForTests(): void {
  localListeners.clear();
  fallbackWarned = false;
  redisBridgeReady = false;
  if (redisPublisher) {
    void redisPublisher.quit();
    redisPublisher = null;
  }
  if (redisSubscriber) {
    void redisSubscriber.quit();
    redisSubscriber = null;
  }
}
