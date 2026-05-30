import { QUEUE_NAMES } from "@airrand/jobs";
import { loadWorkerEnv } from "./load-env.js";
import { logWorkerEvent } from "./logger.js";
import { verifyRedisReachable } from "./redis.js";
import { closeWorkers, createWorkers } from "./workers.js";

loadWorkerEnv();

async function main(): Promise<void> {
  try {
    await verifyRedisReachable();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Redis check failed";
    logWorkerEvent("error", {
      type: "worker_startup_failed",
      message,
    });
    process.exit(1);
  }

  const workers = createWorkers();

  logWorkerEvent("info", {
    type: "worker_started",
    message: "airRand background worker is running",
    queues: Object.values(QUEUE_NAMES),
  });

  const shutdown = async (signal: string) => {
    logWorkerEvent("info", {
      type: "worker_shutdown",
      message: `Received ${signal}; closing workers`,
    });

    try {
      await closeWorkers(workers);
      logWorkerEvent("info", {
        type: "worker_stopped",
        message: "Shutdown complete",
      });
      process.exit(0);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Shutdown failed";
      logWorkerEvent("error", {
        type: "worker_shutdown_failed",
        message,
      });
      process.exit(1);
    }
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Worker failed to start";
  logWorkerEvent("error", {
    type: "worker_startup_failed",
    message,
  });
  process.exit(1);
});
