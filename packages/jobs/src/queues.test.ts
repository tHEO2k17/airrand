import { describe, expect, it } from "vitest";
import {
  DEFAULT_JOB_NAME_BY_QUEUE,
  JOB_NAMES,
  QUEUE_NAMES,
  isKnownQueueName,
  queueNameForJob,
} from "./queues.js";

describe("queue names", () => {
  it("defines stable audit and notification queues", () => {
    expect(QUEUE_NAMES.AUDIT_EXPORT_REQUESTED).toBe("audit.export.requested");
    expect(QUEUE_NAMES.NOTIFICATION_PLACEHOLDER).toBe("notification.placeholder");
  });

  it("maps default job names to queue names", () => {
    expect(DEFAULT_JOB_NAME_BY_QUEUE[QUEUE_NAMES.AUDIT_EXPORT_REQUESTED]).toBe(
      JOB_NAMES.AUDIT_EXPORT_REQUESTED,
    );
    expect(DEFAULT_JOB_NAME_BY_QUEUE[QUEUE_NAMES.NOTIFICATION_PLACEHOLDER]).toBe(
      JOB_NAMES.NOTIFICATION_PLACEHOLDER,
    );
  });

  it("recognizes known queue names", () => {
    expect(isKnownQueueName("audit.export.requested")).toBe(true);
    expect(isKnownQueueName("unknown.queue")).toBe(false);
    expect(queueNameForJob(JOB_NAMES.NOTIFICATION_PLACEHOLDER)).toBe(
      QUEUE_NAMES.NOTIFICATION_PLACEHOLDER,
    );
  });
});
