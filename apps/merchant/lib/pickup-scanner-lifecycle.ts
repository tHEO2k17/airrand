import type { Html5Qrcode } from "html5-qrcode";

/** Stop video MediaStream tracks under a scanner container (html5-qrcode fallback). */
export function stopMediaStreamTracks(containerId: string): void {
  if (typeof document === "undefined") {
    return;
  }

  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }

  for (const video of container.querySelectorAll("video")) {
    const stream = video.srcObject;
    if (
      stream &&
      typeof (stream as MediaStream).getTracks === "function"
    ) {
      for (const track of (stream as MediaStream).getTracks()) {
        track.stop();
      }
    }
    video.srcObject = null;
  }
}

export async function releaseHtml5QrcodeScanner(
  scanner: Html5Qrcode | null | undefined,
  containerId: string,
): Promise<void> {
  if (!scanner) {
    stopMediaStreamTracks(containerId);
    return;
  }

  stopMediaStreamTracks(containerId);

  try {
    if (scanner.isScanning) {
      await scanner.stop();
    }
  } catch {
    // Camera may already be stopped during navigation or Strict Mode teardown.
  }

  try {
    scanner.clear();
  } catch {
    // clear() can throw if the DOM node was removed first.
  }

  stopMediaStreamTracks(containerId);
}

export type ScannerSessionGuard = {
  /** Increment when starting or stopping so stale async work can bail out. */
  bumpGeneration: () => number;
  isCurrentGeneration: (generation: number) => boolean;
  markScanHandled: () => boolean;
  resetScanHandled: () => void;
};

export function createScannerSessionGuard(): ScannerSessionGuard {
  let generation = 0;
  let scanHandled = false;

  return {
    bumpGeneration: () => {
      generation += 1;
      return generation;
    },
    isCurrentGeneration: (value: number) => value === generation,
    markScanHandled: () => {
      if (scanHandled) {
        return false;
      }
      scanHandled = true;
      return true;
    },
    resetScanHandled: () => {
      scanHandled = false;
    },
  };
}
