"use client";

import { useEffect, useRef } from "react";
import { env } from "@/lib/env";

/**
 * Polling fallback simple — appelle `fn` à chaque tick.
 * Pause automatiquement quand l'onglet est masqué.
 */
export function usePolling(
  fn: () => void | Promise<void>,
  options: { enabled?: boolean; intervalMs?: number } = {},
) {
  const { enabled = true, intervalMs = env.POLL_INTERVAL_MS } = options;
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      void fnRef.current();
    };

    const start = () => {
      if (timer) return;
      tick();
      timer = setInterval(tick, intervalMs);
    };

    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    document.addEventListener("visibilitychange", onVisibility);
    if (!document.hidden) start();

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, intervalMs]);
}
