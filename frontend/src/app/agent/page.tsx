"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MOCK_MISSIONS, type Mission, type MissionStatus } from "./data";
import MissionNotification from "./_components/MissionNotification";
import MissionPanel from "./_components/MissionPanel";
import AuthGuard from "@/components/ui/AuthGuard";
import DemoBadge from "@/components/ui/DemoBadge";
import { agentApi } from "@/lib/api/services/agent";
import { missionsApi } from "@/lib/api/services/missions";
import { authApi } from "@/lib/api/services/auth";
import { usePresenceHeartbeat } from "@/lib/hooks/usePresenceHeartbeat";
import { useGeolocation } from "@/lib/hooks/useGeolocation";
import { usePolling } from "@/lib/realtime/usePolling";
import { isNotImplemented } from "@/lib/api/fallback";
import type { ApiError } from "@/lib/types";

const AgentMapView = dynamic(() => import("./_components/AgentMapView"), { ssr: false });

type Screen = "toggle" | "map" | "mission";

export default function AgentPage() {
  return (
    <AuthGuard roles={["agent", "admin", "super_admin"]} redirectTo="/agent/login">
      <AgentPageInner />
    </AuthGuard>
  );
}

function AgentPageInner() {
  const [screen, setScreen] = useState<Screen>("toggle");
  const [available, setAvailable] = useState(false);
  const [missions, setMissions] = useState<Mission[]>(MOCK_MISSIONS);
  const [activeMissionId, setActiveMissionId] = useState<string | null>(MOCK_MISSIONS[0]?.id ?? null);
  const [demoMode, setDemoMode] = useState(false);
  const geo = useGeolocation({ watch: true });

  usePresenceHeartbeat(available ? "available" : "offline");

  const activeMission = missions.find((m) => m.id === activeMissionId) ?? null;

  // Polling de la mission active (fallback toutes les 5s si Reverb pas dispo)
  usePolling(async () => {
    try {
      const m = await missionsApi.myActive();
      if (m) {
        // TODO: mapper Mission API → Mission UI plus précisément quand backend est implémenté
        setDemoMode(false);
      }
    } catch (e) {
      if (isNotImplemented(e as ApiError)) setDemoMode(true);
    }
  }, { intervalMs: 5000, enabled: available });

  async function handleToggle() {
    const next = !available;
    try {
      await agentApi.updatePresence({
        status: next ? "available" : "offline",
        latitude: geo.latitude,
        longitude: geo.longitude,
      });
      setDemoMode(false);
    } catch (e) {
      if (isNotImplemented(e as ApiError)) {
        setDemoMode(true);
      } else {
        // Erreur autre que 501 — on remonte mais on permet quand même le toggle local
      }
    }
    setAvailable(next);
  }

  async function handleStatusChange(status: MissionStatus) {
    if (!activeMissionId) return;
    // Optimistic UI
    setMissions((prev) => prev.map((m) => (m.id === activeMissionId ? { ...m, status } : m)));

    // Best-effort API call — selon le statut visé
    try {
      switch (status) {
        case "accepted":
          await missionsApi.accept(activeMissionId);
          break;
        case "refused":
          await missionsApi.refuse(activeMissionId, "Refus agent");
          break;
        case "on_route":
          await missionsApi.onRoute(activeMissionId, {
            latitude: geo.latitude,
            longitude: geo.longitude,
          });
          break;
        case "on_site":
          await missionsApi.onSite(activeMissionId, {
            latitude: geo.latitude,
            longitude: geo.longitude,
          });
          break;
        case "completed":
          await missionsApi.complete(activeMissionId, { outcome: "resolved" });
          break;
      }
      setDemoMode(false);
    } catch (e) {
      if (isNotImplemented(e as ApiError)) setDemoMode(true);
    }

    if (status === "completed" || status === "refused") {
      setTimeout(() => {
        setScreen("map");
        setActiveMissionId(null);
      }, 1500);
    }
  }

  async function handleLogout() {
    await authApi.logout();
    window.location.href = "/agent/login";
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#0e1419] font-manrope font-light antialiased text-sm">

      {screen === "toggle" && (
        <div className="flex flex-col h-full px-5">
          <div className="pt-12 pb-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500/20 border border-blue-400/30 rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-blue-300">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <span className="text-white/70 text-sm font-medium">Agent Terrain</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-white/30 text-xs hover:text-white/60 transition"
            >
              Déconnexion
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-8">
            <div className="text-center">
              <h1 className="text-white text-2xl font-medium tracking-tight mb-2">Disponibilité</h1>
              <p className="text-white/40 text-sm">
                {available ? "Vous êtes visible sur la carte coordinateur" : "Vous ne recevrez pas de missions"}
              </p>
            </div>

            <button
              onClick={handleToggle}
              className={`relative w-48 h-24 rounded-3xl border-2 transition-all duration-300 ${
                available
                  ? "bg-green-500/20 border-green-400/50 shadow-[0_0_32px_rgba(34,197,94,0.2)]"
                  : "bg-white/[0.05] border-white/15"
              }`}
            >
              <div
                className={`absolute top-3 bottom-3 w-16 rounded-2xl transition-all duration-300 flex items-center justify-center ${
                  available ? "left-[calc(100%-4.5rem)] bg-green-400" : "left-3 bg-white/20"
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${available ? "bg-white" : "bg-white/50"}`} />
              </div>
            </button>

            <div className={`text-lg font-medium tracking-wide transition-colors ${available ? "text-green-400" : "text-white/35"}`}>
              {available ? "DISPONIBLE" : "HORS LIGNE"}
            </div>

            {available && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] border border-white/10">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-white/50 text-xs">Position partagée · Toutes les 30s</span>
              </div>
            )}

            <DemoBadge visible={demoMode} />
          </div>

          {available && (
            <div className="pb-10 shrink-0">
              <button
                onClick={() => setScreen("map")}
                className="w-full h-14 rounded-2xl bg-white text-[#0e1419] text-base font-medium hover:bg-white/90 transition"
              >
                Accéder à la carte →
              </button>
            </div>
          )}
        </div>
      )}

      {screen === "map" && (
        <>
          <AgentMapView activeMission={activeMission} />

          <div className="absolute top-0 left-0 right-0 pt-12 px-4 pb-3 z-10 pointer-events-none">
            <div className="flex items-center justify-between pointer-events-auto">
              <button
                onClick={() => setScreen("toggle")}
                className="flex items-center gap-2 bg-black/40 backdrop-blur-sm border border-white/15 rounded-xl px-3 py-2 text-white/70 text-xs hover:text-white transition"
              >
                <div className={`w-2 h-2 rounded-full ${available ? "bg-green-400" : "bg-white/30"}`} />
                {available ? "Disponible" : "Hors ligne"}
              </button>
              {activeMission && activeMission.status !== "completed" && (
                <button
                  onClick={() => setScreen("mission")}
                  className="flex items-center gap-2 bg-red-500/90 backdrop-blur-sm rounded-xl px-3 py-2 text-white text-xs font-medium"
                >
                  <div className="w-2 h-2 rounded-full bg-white" />
                  Mission active
                </button>
              )}
            </div>
            <DemoBadge visible={demoMode} className="mt-2" />
          </div>

          {activeMission && activeMission.status === "assigned" && (
            <MissionNotification
              mission={activeMission}
              onViewDetail={() => setScreen("mission")}
              onAccept={() => {
                void handleStatusChange("accepted");
                setScreen("mission");
              }}
            />
          )}
        </>
      )}

      {screen === "mission" && activeMission && (
        <MissionPanel
          mission={activeMission}
          onStatusChange={handleStatusChange}
          onClose={() => setScreen("map")}
        />
      )}
    </div>
  );
}
