import { QUEUE_NAMES } from "@airrand/jobs";
import { Worker, type WorkerOptions } from "bullmq";
import { logWorkerEvent } from "./logger.js";
import { processAuditExportRequested } from "./processors/audit-export.js";
import { processNotificationRequested } from "./processors/notification.js";
import { getBullMqConnectionOptions } from "./redis.js";

function parseConcurrency(env: NodeJS.ProcessEnv = process.env): number {
  const raw = Number(env.WORKER_CONCURRENCY ?? "5");
  if (!Number.isFinite(raw) || raw < 1) {
    return 5;
  }
  return Math.floor(raw);
}

function workerOptions(): Omit<WorkerOptions, "connection"> {
  return {
    concurrency: parseConcurrency(),
  };
}

export function createWorkers(): Worker[] {
  const connection = getBullMqConnectionOptions();

  const auditExportWorker = new Worker(
    QUEUE_NAMES.AUDIT_EXPORT_REQUESTED,
    processAuditExportRequested,
    {
      connection,
      ...workerOptions(),
    },
  );

  const notificationWorker = new Worker(
    QUEUE_NAMES.NOTIFICATION_REQUESTED,
    processNotificationRequested,
    {
      connection,
      ...workerOptions(),
    },
  );

  for (const worker of [auditExportWorker, notificationWorker]) {
    worker.on("failed", (job, error) => {
      logWorkerEvent("error", {
        type: "job_failed",
        queue: worker.name,
        jobId: job?.id,
        jobName: job?.name,
        message: error.message,
      });
    });

    worker.on("error", (error) => {
      logWorkerEvent("error", {
        type: "worker_error",
        queue: worker.name,
        message: error.message,
      });
    });
  }

  return [auditExportWorker, notificationWorker];
}

export async function closeWorkers(workers: Worker[]): Promise<void> {
  await Promise.all(workers.map((worker) => worker.close()));
}
