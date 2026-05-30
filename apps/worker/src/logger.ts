export type WorkerLogLevel = "info" | "warn" | "error";

export interface WorkerLogFields {
  type: string;
  queue?: string;
  jobId?: string;
  jobName?: string;
  message?: string;
  durationMs?: number;
  [key: string]: unknown;
}

export function logWorkerEvent(
  level: WorkerLogLevel,
  fields: WorkerLogFields,
): void {
  const line = JSON.stringify({
    level,
    service: "airrand-worker",
    timestamp: new Date().toISOString(),
    ...fields,
  });

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}
