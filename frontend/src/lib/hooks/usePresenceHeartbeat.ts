"use client";

import { useEffect } from "react";
import { agentApi } from "@/lib/api/services/agent";
import type { AgentPresenceStatus } from "@/lib/types";

/**
 * F3.2 — En `available`, position partagée toutes les 30s.
 * En `offline`, plus de partage.
 */
export function usePresenceHeartbeat(status: AgentPresenceStatus, intervalMs = 30000) {
  useEffect(() => {
    if (status !== "available") return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    let cancelled = false;

    const ping = () => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (cancelled) return;
          try {
            await agentApi.updatePresence({
              status: "available",
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
          } catch {
            // silencieux — un échec ponctuel ne doit pas casser la session
          }
        },
        () => {
          // pas de fallback : on ne ping pas si la geo n'est pas dispo
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 },
      );
    };

    ping();
    const id = setInterval(ping, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [status, intervalMs]);
}
