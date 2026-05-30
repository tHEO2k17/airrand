import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createScannerSessionGuard,
  releaseHtml5QrcodeScanner,
  stopMediaStreamTracks,
} from "./pickup-scanner-lifecycle.js";

describe("pickup-scanner-lifecycle", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("stops MediaStream tracks on video elements in the container", () => {
    const stop = vi.fn();
    const video = {
      srcObject: {
        getTracks: () => [{ stop }],
      },
    } as unknown as HTMLVideoElement;

    const container = {
      querySelectorAll: (selector: string) =>
        selector === "video" ? [video] : [],
    } as unknown as HTMLElement;

    vi.stubGlobal("document", {
      getElementById: vi.fn().mockReturnValue(container),
    });

    stopMediaStreamTracks("scanner-test");

    expect(stop).toHaveBeenCalledOnce();
    expect(video.srcObject).toBeNull();
  });

  it("releases html5-qrcode scanner with stop and clear", async () => {
    const stop = vi.fn().mockResolvedValue(undefined);
    const clear = vi.fn();
    const scanner = {
      isScanning: true,
      stop,
      clear,
    } as unknown as import("html5-qrcode").Html5Qrcode;

    await releaseHtml5QrcodeScanner(scanner, "missing-container");

    expect(stop).toHaveBeenCalledOnce();
    expect(clear).toHaveBeenCalledOnce();
  });

  it("ignores stop errors during release", async () => {
    const scanner = {
      isScanning: true,
      stop: vi.fn().mockRejectedValue(new Error("already stopped")),
      clear: vi.fn(),
    } as unknown as import("html5-qrcode").Html5Qrcode;

    await expect(
      releaseHtml5QrcodeScanner(scanner, "missing-container"),
    ).resolves.toBeUndefined();
  });

  it("prevents duplicate scan callbacks in a session", () => {
    const guard = createScannerSessionGuard();

    expect(guard.markScanHandled()).toBe(true);
    expect(guard.markScanHandled()).toBe(false);

    guard.resetScanHandled();
    expect(guard.markScanHandled()).toBe(true);
  });

  it("invalidates stale async work after generation bump", () => {
    const guard = createScannerSessionGuard();
    const first = guard.bumpGeneration();

    expect(guard.isCurrentGeneration(first)).toBe(true);

    guard.bumpGeneration();
    expect(guard.isCurrentGeneration(first)).toBe(false);
  });
});
