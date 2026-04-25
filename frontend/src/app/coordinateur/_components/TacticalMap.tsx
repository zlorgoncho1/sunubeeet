"use client";

import { useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Incident, Agent, Site } from "../data";

const CoordMapView = dynamic(() => import("./CoordMapView"), { ssr: false });

const VIEWS = ["Heatmap", "Agents", "QR"] as const;
type MapView = typeof VIEWS[number];

const FILTER_OPTIONS = {
  Catégorie: ["Santé", "Sécurité", "Foule", "Accès", "Danger", "Perdu / Trouvé", "Autre"],
  Gravité: ["Critique", "Élevé", "Moyen", "Faible"],
  Statut: ["Reçue", "Validée", "Mission assignée", "En cours", "Résolue"],
  "Zone": ["Zone Nord", "Zone Sud", "Zone Est", "Zone Ouest", "Tout"],
};

interface TacticalMapProps {
  incidents: Incident[];
  agents: Agent[];
  sites: Site[];
  selectedId: string | null;
  activeView: MapView;
  onViewChange: (v: MapView) => void;
  onSelectIncident: (id: string) => void;
}

export default function TacticalMap({
  incidents,
  agents,
  sites,
  selectedId,
  activeView,
  onViewChange,
  onSelectIncident,
}: TacticalMapProps) {
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openFilter) return;
    function handleOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setOpenFilter(null);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [openFilter]);

  const filterLabels = Object.keys(FILTER_OPTIONS) as (keyof typeof FILTER_OPTIONS)[];
  const duplicatePotential = incidents.filter((i) => i.severity === "élevé" && i.status === "validée").length;

  return (
    <div className="flex-1 relative overflow-hidden">
      {/* Carte Mapbox */}
      <CoordMapView
        incidents={incidents}
        agents={agents}
        sites={sites}
        selectedId={selectedId}
        activeView={activeView}
        onSelectIncident={onSelectIncident}
      />

      {/* Floating filter bar */}
      <div
        ref={filterRef}
        className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10"
      >
        <div className="flex items-center gap-2 pointer-events-auto">
          {filterLabels.map((label) => {
            const active = activeFilters[label];
            return (
              <div key={label} className="relative">
                <button
                  onClick={() => setOpenFilter(openFilter === label ? null : label)}
                  className={`flex items-center gap-1.5 border shadow-sm px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? "bg-black text-white border-black"
                      : "bg-white border-black/10 text-[#212529] hover:bg-black/[0.02]"
                  }`}
                >
                  {active ? `${label}: ${active}` : label}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {openFilter === label && (
                  <div className="absolute top-full mt-1.5 left-0 bg-white border border-black/10 rounded-xl shadow-xl py-1 min-w-[160px] z-50">
                    {active && (
                      <button
                        onClick={() => {
                          const next = { ...activeFilters };
                          delete next[label];
                          setActiveFilters(next);
                          setOpenFilter(null);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-[#6c757d] hover:bg-black/[0.02] transition-colors"
                      >
                        Tout afficher
                      </button>
                    )}
                    {FILTER_OPTIONS[label].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setActiveFilters((prev) => ({ ...prev, [label]: opt }));
                          setOpenFilter(null);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                          active === opt
                            ? "font-medium text-[#212529] bg-black/[0.03]"
                            : "text-[#212529] hover:bg-black/[0.02]"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Vue toggle */}
        <div className="flex items-center gap-1 bg-white border border-black/10 shadow-sm p-1 rounded-lg pointer-events-auto">
          {VIEWS.map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                activeView === v
                  ? "bg-black/[0.06] text-[#212529]"
                  : "text-[#6c757d] hover:bg-black/[0.02]"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Bandeau doublons */}
      {duplicatePotential > 0 && (
        <div className="absolute top-16 left-4 flex items-center gap-3 bg-white border border-orange-200 shadow-lg px-4 py-3 rounded-xl z-10 pointer-events-auto">
          <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-medium text-[#212529]">{duplicatePotential} doublon{duplicatePotential > 1 ? "s" : ""} potentiel{duplicatePotential > 1 ? "s" : ""} détecté{duplicatePotential > 1 ? "s" : ""}</div>
            <div className="text-[10px] text-[#6c757d]">Zone Stade Annexe · il y a 5 min</div>
          </div>
          <button className="ml-2 text-xs font-medium text-orange-600 hover:text-orange-700">Examiner</button>
        </div>
      )}
    </div>
  );
}
