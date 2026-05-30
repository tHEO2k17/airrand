export const STORE_BREAKPOINTS = {
  sm: 640,
  md: 900,
  lg: 1200,
} as const;

export type StoreBreakpoint = keyof typeof STORE_BREAKPOINTS;

export function storeBreakpointMinWidth(breakpoint: StoreBreakpoint): number {
  return STORE_BREAKPOINTS[breakpoint];
}

export function matchesStoreBreakpoint(
  viewportWidth: number,
  breakpoint: StoreBreakpoint,
): boolean {
  return viewportWidth >= STORE_BREAKPOINTS[breakpoint];
}

export function storeProductGridColumns(viewportWidth: number): 1 | 2 | 3 | 4 {
  if (viewportWidth >= STORE_BREAKPOINTS.lg) {
    return 4;
  }
  if (viewportWidth >= STORE_BREAKPOINTS.md) {
    return 3;
  }
  if (viewportWidth >= 560) {
    return 2;
  }
  return 1;
}
