"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { alertesApi, type TimelineEvent } from "@/lib/api/services/alertes";
import { useApi } from "@/lib/hooks/useApi";
import { getAccessToken } from "@/lib/auth/tokens";
import {
  ALERTE_STATUS_LABELS,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
} from "@/lib/i18n/labels";
import type { Alerte } from "@/lib/types";

const ALERTE_STATUS_COLORS: Record<Alerte["status"], string> = {
  received: "bg-blue-50 text-blue-600 border-blue-100",
  validated: "bg-orange-50 text-orange-600 border-orange-100",
  duplicate: "bg-gray-50 text-gray-500 border-gray-100",
  false_alert: "bg-gray-50 text-gray-500 border-gray-100",
  rejected: "bg-rose-50 text-rose-600 border-rose-100",
};

const TIMELINE_STEP_LABELS: Record<string, string> = {
  "alerte.created": "Alerte reçue",
  "alerte.validated": "Validée",
  "alerte.marked_duplicate": "Marquée doublon",
  "alerte.marked_false_alert": "Fausse alerte confirmée",
  "alerte.rejected": "Rejetée",
  "incident.qualified": "En cours d'examen",
  "mission.assigned": "Mission assignée à un agent",
  "mission.accepted": "Agent en route",
  "mission.on_route": "Agent en route",
  "mission.on_site": "Agent sur place",
  "mission.completed": "Intervention terminée",
  "incident.resolved": "Résolue",
  "incident.closed": "Clôturée",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (isToday) return `Aujourd'hui, ${time}`;
  if (isYesterday) return `Hier, ${time}`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) + `, ${time}`;
}

export default function HistoriquePage() {
  // Auth state minimal inline (pas de hook partagé : la logique fait ≈5 lignes
  // et reste self-contained). Si l'app gagne 3+ consommateurs, factoriser.
  const [authLoading, setAuthLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  useEffect(() => {
    setAuthenticated(Boolean(getAccessToken()));
    setAuthLoading(false);
  }, []);

  const { data, loading, error, refetch } = useApi(
    () => alertesApi.listMine({ page: 1 }),
    [],
    { enabled: authenticated },
  );
  const [selectedAlerte, setSelectedAlerte] = useState<Alerte | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  async function openAlerte(alerte: Alerte) {
    setSelectedAlerte(alerte);
    setTimeline([]);
    setTimelineLoading(true);
    try {
      const t = await alertesApi.timeline(alerte.id);
      setTimeline(t.timeline);
    } catch {
      setTimeline([]);
    } finally {
      setTimelineLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0e1419] flex items-center justify-center text-white/40">
        Chargement…
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0e1419] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-white/60 text-sm mb-3">Connectez-vous pour voir vos signalements</p>
        <Link href="/auth/login" className="text-rose-300 text-sm underline-offset-4 hover:underline">
          Se connecter →
        </Link>
      </div>
    );
  }

  const alertes = data?.data ?? [];

  return (
    <div className="min-h-screen bg-[#0e1419] font-manrope font-light antialiased text-sm">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center gap-3 border-b border-white/[0.06]">
        <Link href="/" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-white/50 transition">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-white text-base font-medium tracking-tight">Mes signalements</h1>
          <p className="text-white/40 text-xs">
            {data?.total ?? 0} alerte{(data?.total ?? 0) > 1 ? "s" : ""} soumise{(data?.total ?? 0) > 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="text-white/40 hover:text-white/70 transition text-xs"
        >
          Actualiser
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="p-10 text-center text-white/40 text-sm">Chargement…</div>
      ) : error ? (
        <div className="p-10 text-center text-rose-300/80 text-sm">{error.message}</div>
      ) : alertes.length === 0 ? (
        <div className="p-10 text-center text-white/30 text-sm">
          Aucun signalement pour le moment.
        </div>
      ) : (
        <div className="px-4 py-4 flex flex-col gap-3">
          {alertes.map((alerte) => {
            const ic = CATEGORY_ICONS[alerte.category];
            return (
              <button
                key={alerte.id}
                onClick={() => openAlerte(alerte)}
                className="w-full text-left bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4 hover:bg-white/[0.07] transition active:scale-[0.99]"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl ${ic.bg} ring-1 ring-white/10 flex items-center justify-center ${ic.text} shrink-0`}>
                    <iconify-icon icon={ic.icon} width={18}></iconify-icon>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white/50 text-[10px] font-medium">{alerte.reference}</span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded border uppercase tracking-wider ${ALERTE_STATUS_COLORS[alerte.status]}`}>
                        {ALERTE_STATUS_LABELS[alerte.status]}
                      </span>
                    </div>
                    <p className="text-white/80 text-sm font-medium truncate">
                      {CATEGORY_LABELS[alerte.category]}
                      {alerte.is_potential_duplicate && (
                        <span className="ml-2 text-amber-300 text-[10px]">· doublon potentiel</span>
                      )}
                    </p>
                    <p className="text-white/40 text-xs mt-0.5 truncate">
                      {alerte.description ?? "Sans description"}
                    </p>
                    <p className="text-white/25 text-xs mt-1">{formatDate(alerte.created_at)}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail sheet */}
      {selectedAlerte && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedAlerte(null)}
          />
          <div className="relative bg-[#151b22] border-t border-white/[0.08] rounded-t-3xl p-5 max-h-[80vh] overflow-y-auto coord-scroll">
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-5" />

            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-white/40 text-xs mb-1">{selectedAlerte.reference}</p>
                <h2 className="text-white text-lg font-medium">{CATEGORY_LABELS[selectedAlerte.category]}</h2>
                <p className="text-white/50 text-xs mt-0.5">
                  {selectedAlerte.latitude.toFixed(5)}, {selectedAlerte.longitude.toFixed(5)}
                </p>
              </div>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded border uppercase tracking-wider shrink-0 ${ALERTE_STATUS_COLORS[selectedAlerte.status]}`}>
                {ALERTE_STATUS_LABELS[selectedAlerte.status]}
              </span>
            </div>

            <div className="mb-5">
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Votre signalement</p>
              <p className="text-white/70 text-sm leading-relaxed bg-white/[0.04] border border-white/[0.06] rounded-xl p-3">
                {selectedAlerte.description ?? "Sans description"}
              </p>
            </div>

            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-3">Suivi</p>
              {timelineLoading ? (
                <p className="text-white/40 text-xs">Chargement…</p>
              ) : timeline.length === 0 ? (
                <p className="text-white/30 text-xs">Aucun évènement enregistré.</p>
              ) : (
                <div className="flex flex-col gap-0">
                  {timeline.map((step, idx) => {
                    const label = TIMELINE_STEP_LABELS[step.action] ?? step.action;
                    const time = new Date(step.created_at).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    return (
                      <div key={idx} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full mt-0.5 shrink-0 border-2 bg-white border-white" />
                          {idx < timeline.length - 1 && (
                            <div className="w-px mt-1 mb-1 bg-white/40" style={{ minHeight: "20px" }} />
                          )}
                        </div>
                        <div className="pb-3 flex-1 flex items-start justify-between">
                          <p className="text-sm text-white/80">{label}</p>
                          <span className="text-xs text-white/40">{time}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
