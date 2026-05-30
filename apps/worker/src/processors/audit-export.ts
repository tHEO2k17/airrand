import {
  JOB_NAMES,
  QUEUE_NAMES,
  parseAuditExportRequestedPayload,
} from "@airrand/jobs";
import {
  auditExportJobs,
  auditLogs,
  orders,
} from "@airrand/database";
import {
  buildAuditExportCsv,
  type AuditExportCsvRow,
} from "@airrand/domain";
import type { Job } from "bullmq";
import { asc, eq } from "drizzle-orm";
import { logWorkerEvent } from "../logger.js";
import { db } from "../lib/db.js";
import { writeAuditExportFile } from "../lib/export-storage.js";

const SAFE_FAILURE_MESSAGE = "Audit export failed";

export async function processAuditExportRequested(
  job: Job,
): Promise<{ status: "completed" | "failed"; exportJobId: string }> {
  const startedAt = Date.now();
  const payload = parseAuditExportRequestedPayload(job.data);

  logWorkerEvent("info", {
    type: "job_started",
    queue: QUEUE_NAMES.AUDIT_EXPORT_REQUESTED,
    jobName: JOB_NAMES.AUDIT_EXPORT_REQUESTED,
    jobId: job.id,
    exportJobId: payload.exportJobId,
    merchantId: payload.merchantId,
    format: payload.format,
  });

  try {
    await db
      .update(auditExportJobs)
      .set({
        status: "processing",
        startedAt: new Date(),
      })
      .where(eq(auditExportJobs.id, payload.exportJobId));

    const rows = await db
      .select({
        log: auditLogs,
        orderReference: orders.reference,
      })
      .from(auditLogs)
      .leftJoin(orders, eq(auditLogs.orderId, orders.id))
      .where(eq(auditLogs.merchantId, payload.merchantId))
      .orderBy(asc(auditLogs.createdAt));

    const csvRows: AuditExportCsvRow[] = rows.map(({ log, orderReference }) => ({
      createdAt: log.createdAt.toISOString(),
      action: log.action,
      actorType: log.actorType,
      actorLabel: log.actorLabel,
      orderReference: orderReference ?? null,
      metadata: log.metadata,
    }));

    const csvContent = buildAuditExportCsv(csvRows);
    const filePath = await writeAuditExportFile(
      payload.merchantId,
      payload.exportJobId,
      csvContent,
    );

    await db
      .update(auditExportJobs)
      .set({
        status: "completed",
        filePath,
        completedAt: new Date(),
        errorMessage: null,
      })
      .where(eq(auditExportJobs.id, payload.exportJobId));

    logWorkerEvent("info", {
      type: "audit_export_completed",
      queue: QUEUE_NAMES.AUDIT_EXPORT_REQUESTED,
      jobName: JOB_NAMES.AUDIT_EXPORT_REQUESTED,
      jobId: job.id,
      exportJobId: payload.exportJobId,
      merchantId: payload.merchantId,
      rowCount: csvRows.length,
      filePath,
    });

    logWorkerEvent("info", {
      type: "job_completed",
      queue: QUEUE_NAMES.AUDIT_EXPORT_REQUESTED,
      jobName: JOB_NAMES.AUDIT_EXPORT_REQUESTED,
      jobId: job.id,
      durationMs: Date.now() - startedAt,
      merchantId: payload.merchantId,
      exportJobId: payload.exportJobId,
    });

    return { status: "completed", exportJobId: payload.exportJobId };
  } catch (error) {
    await db
      .update(auditExportJobs)
      .set({
        status: "failed",
        errorMessage: SAFE_FAILURE_MESSAGE,
        completedAt: new Date(),
      })
      .where(eq(auditExportJobs.id, payload.exportJobId))
      .catch((updateError) => {
        logWorkerEvent("error", {
          type: "audit_export_status_update_failed",
          exportJobId: payload.exportJobId,
          message:
            updateError instanceof Error
              ? updateError.message
              : "Failed to mark export as failed",
        });
      });

    logWorkerEvent("error", {
      type: "audit_export_failed",
      queue: QUEUE_NAMES.AUDIT_EXPORT_REQUESTED,
      jobId: job.id,
      exportJobId: payload.exportJobId,
      merchantId: payload.merchantId,
      message: error instanceof Error ? error.message : SAFE_FAILURE_MESSAGE,
    });

    throw error;
  }
}
