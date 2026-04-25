"use client";

import { useEffect, useState } from "react";
import Sidebar from "./_components/Sidebar";
import CoordTopBar from "./_components/CoordTopBar";
import KPIBar from "./_components/KPIBar";
import TacticalMap from "./_components/TacticalMap";
import IncidentPanel from "./_components/IncidentPanel";
import DispatchModal from "./_components/DispatchModal";
import {
  MOCK_INCIDENTS,
  MOCK_AGENTS,
  MOCK_SITES,
  type Incident,
} from "./data";
import AuthGuard from "@/components/ui/AuthGuard";
import DemoBadge from "@/components/ui/DemoBadge";
import { dashboardApi } from "@/lib/api/services/dashboard";
import { incidentsApi } from "@/lib/api/services/incidents";
import { missionsApi } from "@/lib/api/services/missions";
import { isNotImplemented } from "@/lib/api/fallback";
import { usePolling } from "@/lib/realtime/usePolling";
import type { ApiError } from "@/lib/types";

type MapView = "Heatmap" | "Agents" | "QR";

export default function CoordinateurPage() {
  return (
    <AuthGuard
      roles={["coordinator", "admin", "super_admin"]}
      redirectTo="/coordinateur/login"
    >
      <CoordinateurDashboard />
    </AuthGuard>
  );
}

function CoordinateurDashboard() {
  const [incidents, setIncidents] = useState<Incident[]>(MOCK_INCIDENTS);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(
    MOCK_INCIDENTS[0]?.id ?? null,
  );
  const [mapView, setMapView] = useState<MapView>("Heatmap");
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [preselectedAgentId, setPreselectedAgentId] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  // Polling des incidents live + KPIs (avec fallback mock si 501)
  usePolling(async () => {
    try {
      await Promise.all([
        dashboardApi.kpis(),
        dashboardApi.incidentsLive(),
        dashboardApi.agentsLive(),
      ]);
      setDemoMode(false);
    } catch (e) {
      if (isNotImplemented(e as ApiError)) setDemoMode(true);
    }
  }, { intervalMs: 8000 });

  const selectedIncident = incidents.find((i) => i.id === selectedIncidentId) ?? null;

  function updateStatus(id: string, status: Incident["status"]) {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, status } : inc)),
    );
  }

  async function handleValidate() {
    if (!selectedIncidentId) return;
    updateStatus(selectedIncidentId, "validée");
    try {
      await incidentsApi.update(selectedIncidentId, { status: "qualified" });
    } catch (e) {
      if (isNotImplemented(e as ApiError)) setDemoMode(true);
    }
  }

  async function handleMarkDuplicate() {
    if (!selectedIncidentId) return;
    updateStatus(selectedIncidentId, "doublon");
    setSelectedIncidentId(null);
  }

  async function handleReject() {
    if (!selectedIncidentId) return;
    updateStatus(selectedIncidentId, "fausse_alerte");
    setSelectedIncidentId(null);
    try {
      await incidentsApi.cancel(selectedIncidentId, "Fausse alerte");
    } catch (e) {
      if (isNotImplemented(e as ApiError)) setDemoMode(true);
    }
  }

  function handleOpenDispatch(agentId?: string) {
    setPreselectedAgentId(agentId ?? null);
    setDispatchOpen(true);
  }

  async function handleConfirmDispatch(agentId: string, note: string) {
    if (!selectedIncidentId) return;
    updateStatus(selectedIncidentId, "mission_assignée");
    setDispatchOpen(false);
    try {
      await missionsApi.create({
        incident_id: selectedIncidentId,
        agent_id: agentId,
        briefing: note || null,
      });
    } catch (e) {
      if (isNotImplemented(e as ApiError)) setDemoMode(true);
    }
  }

  return (
    <div className="min-h-screen antialiased text-[#212529] bg-white font-manrope font-light text-sm overflow-hidden flex">
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#fcfcfc]">
        <CoordTopBar />
        <div className="flex items-center justify-between px-6 py-1">
          <DemoBadge visible={demoMode} />
        </div>
        <KPIBar incidents={incidents} agents={MOCK_AGENTS} />

        <div className="flex-1 flex overflow-hidden">
          <TacticalMap
            incidents={incidents.filter(
              (i) => !["résolue", "doublon", "fausse_alerte"].includes(i.status),
            )}
            agents={MOCK_AGENTS}
            sites={MOCK_SITES}
            selectedId={selectedIncidentId}
            activeView={mapView}
            onViewChange={setMapView}
            onSelectIncident={setSelectedIncidentId}
          />

          {selectedIncident && (
            <IncidentPanel
              incident={selectedIncident}
              agents={MOCK_AGENTS}
              sites={MOCK_SITES}
              onDispatch={handleOpenDispatch}
              onValidate={handleValidate}
              onMarkDuplicate={handleMarkDuplicate}
              onReject={handleReject}
              onClose={() => setSelectedIncidentId(null)}
            />
          )}
        </div>
      </main>

      <DispatchModal
        open={dispatchOpen}
        incidentId={selectedIncidentId}
        preselectedAgentId={preselectedAgentId}
        agents={MOCK_AGENTS}
        onClose={() => setDispatchOpen(false)}
        onConfirm={handleConfirmDispatch}
      />
    </div>
  );
}
