import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readAlertsMuted, writeAlertsMuted } from "./preferences.js";

const store: Record<string, string> = {};

describe("alert mute preference", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        for (const key of Object.keys(store)) {
          delete store[key];
        }
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    for (const key of Object.keys(store)) {
      delete store[key];
    }
  });

  it("defaults to unmuted", () => {
    expect(readAlertsMuted()).toBe(false);
  });

  it("persists mute preference", () => {
    writeAlertsMuted(true);
    expect(readAlertsMuted()).toBe(true);
    writeAlertsMuted(false);
    expect(readAlertsMuted()).toBe(false);
  });
});
