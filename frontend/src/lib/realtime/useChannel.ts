"use client";

import { useEffect } from "react";
import { getEcho } from "./echo";

/**
 * Hook generic pour s'abonner à un canal privé et écouter un ou plusieurs events.
 * Si Echo n'est pas configuré, le hook ne fait rien (le polling fallback prend le relais).
 */
export function useChannel(
  channelName: string | null,
  events: Record<string, (payload: unknown) => void>,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled || !channelName) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const echo = await getEcho();
      if (!echo || cancelled) return;

      const channel = echo.private(channelName);
      const eventNames = Object.keys(events);
      eventNames.forEach((evt) => channel.listen(evt, events[evt]));

      cleanup = () => {
        eventNames.forEach((evt) => channel.stopListening(evt));
        echo.leave(channelName);
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, enabled]);
}
