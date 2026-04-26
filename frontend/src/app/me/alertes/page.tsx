"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AuthGuard from "@/components/ui/AuthGuard";
import { alertesApi, type TimelineEvent, type TimelineResponse } from "@/lib/api/services/alertes";
import { ALERTE_STATUS_LABELS, CATEGORY_LABELS } from "@/lib/i18n/labels";
import type { ApiError } from "@/lib/types";

const ACTION_LABELS: Record<string, string> = {
  "alerte.created": "Alerte reçue",
  "alerte.validated": "Validée",
  "alerte.marked_duplicate": "Marquée doublon",
  "alerte.marked_false_alert": "Fausse alerte",
  "incident.qualified": "En cours d'examen",
  "mission.assigned": "Mission assignée",
  "mission.accepted": "Agent en route",
  "mission.on_route": "Agent en route",
  "mission.on_site": "Agent sur place",
  "mission.completed": "Intervention terminée",
  "incident.resolved": "Résolue",
  "incident.closed": "Clôturée",
};

export default function AlerteTimelinePage() {
  return (
    <AuthGuard>
      <Suspense fallback={<p className="text-white/40 text-center py-10">Chargement…</p>}>
        <Inner />
      </Suspense>
    </AuthGuard>
  );
}

function Inner() {
  const searchParams = useSearchParams();
  const id = searchParams?.get("id") ?? null;
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("Identifiant d'alerte manquant.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await alertesApi.timeline(id);
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) setError((e as ApiError).message ?? "Échec du chargement");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-[#0e1419] font-manrope font-light antialiased text-sm text-white/90">
      <div className="px-5 pt-12 pb-4 border-b border-white/[0.06] flex items-center gap-3">
        <Link href="/historique" className="text-white/45 hover:text-white text-xs">
          ← Mes alertes
        </Link>
        <h1 className="text-base font-medium">Suivi de l&apos;alerte</h1>
      </div>

      <div className="p-5 max-w-2xl mx-auto">
        {loading ? (
          <p className="text-white/40 text-center py-10">Chargement…</p>
        ) : error ? (
          <p className="text-rose-300 text-center py-10">{error}</p>
        ) : data ? (
          <>
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4 mb-4">
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">{data.alerte.reference}</p>
              <h2 className="text-white text-lg font-medium">
                {CATEGORY_LABELS[data.alerte.category]}
              </h2>
              <p className="text-white/60 text-xs mt-1">{ALERTE_STATUS_LABELS[data.alerte.status]}</p>
            </div>

            <p className="text-white/40 text-[10px] uppercase tracking-wider mb-3">Évènements</p>
            {data.timeline.length === 0 ? (
              <p className="text-white/30 text-xs">Aucun évènement enregistré.</p>
            ) : (
              <Timeline timeline={data.timeline} />
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

function Timeline({ timeline }: { timeline: TimelineEvent[] }) {
  return (
    <div className="flex flex-col gap-0">
      {timeline.map((step, idx) => {
        const label = ACTION_LABELS[step.action] ?? step.action;
        const time = new Date(step.created_at).toLocaleString("fr-FR", {
          day: "numeric",
          month: "short",
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
            <div className="pb-3 flex-1 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-white/80">{label}</p>
                {step.note && (
                  <p className="text-xs text-white/45 mt-0.5">{step.note}</p>
                )}
              </div>
              <span className="text-xs text-white/40 shrink-0">{time}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
