import { describe, expect, it } from "vitest";
import {
  matchesStoreBreakpoint,
  storeBreakpointMinWidth,
  storeProductGridColumns,
} from "./responsive.js";

describe("responsive utilities", () => {
  it("returns canonical breakpoint widths", () => {
    expect(storeBreakpointMinWidth("sm")).toBe(640);
    expect(storeBreakpointMinWidth("md")).toBe(900);
    expect(storeBreakpointMinWidth("lg")).toBe(1200);
  });

  it("matches viewport against breakpoints", () => {
    expect(matchesStoreBreakpoint(639, "sm")).toBe(false);
    expect(matchesStoreBreakpoint(640, "sm")).toBe(true);
    expect(matchesStoreBreakpoint(899, "md")).toBe(false);
    expect(matchesStoreBreakpoint(900, "md")).toBe(true);
  });

  it("derives product grid column count from viewport", () => {
    expect(storeProductGridColumns(375)).toBe(1);
    expect(storeProductGridColumns(600)).toBe(2);
    expect(storeProductGridColumns(960)).toBe(3);
    expect(storeProductGridColumns(1280)).toBe(4);
  });
});
