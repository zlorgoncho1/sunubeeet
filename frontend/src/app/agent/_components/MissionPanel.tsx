"use client";

import { Mission, MissionStatus, STATUS_LABELS } from "../data";

interface Props {
  mission: Mission;
  onStatusChange: (status: MissionStatus) => void;
  onClose: () => void;
}

const TIMELINE_STEPS: { status: MissionStatus; label: string }[] = [
  { status: "assigned", label: "Mission reçue" },
  { status: "accepted", label: "Acceptée" },
  { status: "on_route", label: "En route" },
  { status: "on_site", label: "Sur place" },
  { status: "completed", label: "Terminée" },
];

const STATUS_ORDER: MissionStatus[] = ["assigned", "accepted", "on_route", "on_site", "completed"];

function getStepIndex(status: MissionStatus): number {
  return STATUS_ORDER.indexOf(status);
}

export default function MissionPanel({ mission, onStatusChange, onClose }: Props) {
  const currentIdx = getStepIndex(mission.status);

  const severityBg =
    mission.severity === "critique"
      ? "bg-red-50 text-red-600 border-red-100"
      : mission.severity === "élevé"
      ? "bg-orange-50 text-orange-600 border-orange-100"
      : "bg-yellow-50 text-yellow-600 border-yellow-100";

  return (
    <div className="absolute inset-0 bg-[#0e1419] flex flex-col z-20 overflow-hidden font-manrope font-light antialiased">
      {/* Header */}
      <div className="pt-12 px-5 pb-4 border-b border-white/[0.06] shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded border uppercase tracking-wider ${severityBg}`}>
                {mission.severity}
              </span>
              <span className="text-[10px] bg-white/10 text-white/60 px-2 py-0.5 rounded border border-white/10 uppercase tracking-wider">
                {STATUS_LABELS[mission.status]}
              </span>
            </div>
            <h2 className="text-white text-lg font-medium tracking-tight">{mission.incidentTitle}</h2>
            <p className="text-white/45 text-xs mt-0.5">{mission.location} · {mission.time}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-white/50 transition shrink-0"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-5 h-5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto coord-scroll">
        <div className="p-5 flex flex-col gap-6">

          {/* Briefing */}
          <div>
            <h3 className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Briefing coordinateur</h3>
            <p className="text-white/80 text-sm leading-relaxed bg-white/[0.04] border border-white/[0.06] rounded-xl p-3">
              {mission.briefing}
            </p>
          </div>

          {/* Description initiale */}
          <div>
            <h3 className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Signalement initial</h3>
            <p className="text-white/60 text-sm italic leading-relaxed">{mission.description}</p>
          </div>

          {/* Sites suggérés */}
          <div>
            <h3 className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Services à contacter</h3>
            <div className="flex flex-col gap-2">
              {mission.suggestedSites.map((site) => (
                <div
                  key={site.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]"
                >
                  <div>
                    <div className="text-white/80 text-sm font-medium">{site.name}</div>
                    <div className="text-white/40 text-xs">{site.type} · {site.distance}</div>
                  </div>
                  <a
                    href={`tel:${site.phone}`}
                    className="w-8 h-8 rounded-lg bg-green-500/20 border border-green-400/30 flex items-center justify-center text-green-400 hover:bg-green-500/30 transition"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.63 19.79 19.79 0 01.22 1 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.29 6.29l1.57-1.57a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                    </svg>
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h3 className="text-white/40 text-[10px] uppercase tracking-wider mb-3">Progression</h3>
            <div className="flex flex-col gap-0">
              {TIMELINE_STEPS.map((step, idx) => {
                const done = idx <= currentIdx;
                const active = idx === currentIdx;
                return (
                  <div key={step.status} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full mt-0.5 shrink-0 border-2 transition-all ${
                        active ? "bg-white border-white" : done ? "bg-white/60 border-white/60" : "bg-transparent border-white/20"
                      }`} />
                      {idx < TIMELINE_STEPS.length - 1 && (
                        <div className={`w-px flex-1 mt-1 mb-1 ${done && idx < currentIdx ? "bg-white/40" : "bg-white/10"}`} style={{ minHeight: "20px" }} />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className={`text-sm ${active ? "text-white font-medium" : done ? "text-white/60" : "text-white/25"}`}>
                        {step.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer — action buttons */}
      <div className="p-4 border-t border-white/[0.06] shrink-0">
        {mission.status === "assigned" && (
          <div className="flex gap-3">
            <button
              onClick={() => onStatusChange("refused")}
              className="flex-1 h-12 rounded-xl bg-white/[0.06] border border-white/10 text-white/70 text-sm font-medium hover:bg-white/10 transition"
            >
              Refuser
            </button>
            <button
              onClick={() => onStatusChange("accepted")}
              className="flex-1 h-12 rounded-xl bg-white text-[#0e1419] text-sm font-medium hover:bg-white/90 transition"
            >
              Accepter la mission
            </button>
          </div>
        )}
        {mission.status === "accepted" && (
          <button
            onClick={() => onStatusChange("on_route")}
            className="w-full h-12 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition"
          >
            En route →
          </button>
        )}
        {mission.status === "on_route" && (
          <button
            onClick={() => onStatusChange("on_site")}
            className="w-full h-12 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition"
          >
            Je suis sur place
          </button>
        )}
        {mission.status === "on_site" && (
          <button
            onClick={() => onStatusChange("completed")}
            className="w-full h-12 rounded-xl bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition"
          >
            Terminer la mission ✓
          </button>
        )}
        {mission.status === "completed" && (
          <div className="flex items-center justify-center gap-2 py-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-green-400">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className="text-green-400 text-sm font-medium">Mission terminée</span>
          </div>
        )}
        {mission.status === "refused" && (
          <p className="text-white/40 text-sm text-center py-2">Mission refusée — vous avez été retiré de l&apos;assignation</p>
        )}
      </div>
    </div>
  );
}
