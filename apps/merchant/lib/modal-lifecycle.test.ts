import { afterEach, describe, expect, it, vi } from "vitest";
import {
  bindModalEscapeKey,
  bindModalLifecycle,
  lockBodyScroll,
} from "./modal-lifecycle.js";

describe("modal-lifecycle", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn();
    const listeners = new Map<string, EventListener>();

    vi.stubGlobal("document", {
      addEventListener: (type: string, handler: EventListener) => {
        listeners.set(type, handler);
      },
      removeEventListener: (type: string) => {
        listeners.delete(type);
      },
    });

    bindModalEscapeKey(onClose);
    listeners.get("keydown")?.({ key: "Escape" } as KeyboardEvent);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("locks and restores body scroll", () => {
    const body = { style: { overflow: "auto" } };
    vi.stubGlobal("document", { body });

    const unlock = lockBodyScroll();
    expect(body.style.overflow).toBe("hidden");

    unlock();
    expect(body.style.overflow).toBe("auto");
  });

  it("cleans up escape handler and scroll lock together", () => {
    const onClose = vi.fn();
    const listeners = new Map<string, EventListener>();
    const body = { style: { overflow: "visible" } };

    vi.stubGlobal("document", {
      body,
      addEventListener: (type: string, handler: EventListener) => {
        listeners.set(type, handler);
      },
      removeEventListener: vi.fn((type: string) => {
        listeners.delete(type);
      }),
    });

    const cleanup = bindModalLifecycle(onClose);
    expect(body.style.overflow).toBe("hidden");

    cleanup();
    expect(body.style.overflow).toBe("visible");
    expect(document.removeEventListener).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function),
    );
    expect(listeners.has("keydown")).toBe(false);
  });
});
