import { afterEach, describe, expect, it, vi } from "vitest";
import { logWorkerEvent } from "./logger.js";

describe("logWorkerEvent", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes structured JSON to stdout", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});

    logWorkerEvent("info", {
      type: "job_completed",
      queue: "audit.export.requested",
      jobId: "job-1",
    });

    expect(spy).toHaveBeenCalledOnce();
    const line = spy.mock.calls[0]?.[0];
    expect(typeof line).toBe("string");
    const parsed = JSON.parse(String(line)) as Record<string, unknown>;
    expect(parsed.service).toBe("airrand-worker");
    expect(parsed.type).toBe("job_completed");
    expect(parsed.queue).toBe("audit.export.requested");
  });
});
