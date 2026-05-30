import { useEffect, useRef } from "react";

export function usePollingRefresh(
  callback: () => void | Promise<void>,
  intervalMs: number,
  enabled: boolean,
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const tick = () => {
      void callbackRef.current();
    };
    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs, enabled]);
}
