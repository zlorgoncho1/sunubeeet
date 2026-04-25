"use client";

import { Mission } from "../data";

interface Props {
  mission: Mission;
  onViewDetail: () => void;
  onAccept: () => void;
}

export default function MissionNotification({ mission, onViewDetail, onAccept }: Props) {
  const severityColor =
    mission.severity === "critique"
      ? "border-red-400/40 bg-red-500/10"
      : mission.severity === "élevé"
      ? "border-orange-400/40 bg-orange-500/10"
      : "border-blue-400/40 bg-blue-500/10";

  return (
    <div className={`absolute bottom-6 left-4 right-4 z-30 rounded-2xl border backdrop-blur-md p-4 shadow-2xl ${severityColor}`}>
      {/* Pulse indicator */}
      <div className="flex items-start gap-3">
        <div className="relative mt-0.5 shrink-0">
          <div className="w-3 h-3 rounded-full bg-red-400 animate-ping absolute" />
          <div className="w-3 h-3 rounded-full bg-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-[10px] uppercase tracking-wider font-medium mb-0.5 opacity-70">
            Nouvelle mission — {mission.time}
          </p>
          <p className="text-white text-sm font-medium truncate">{mission.incidentTitle}</p>
          <p className="text-white/60 text-xs mt-0.5">{mission.location}</p>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={onViewDetail}
          className="flex-1 h-9 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-medium hover:bg-white/15 transition"
        >
          Voir détails
        </button>
        <button
          onClick={onAccept}
          className="flex-1 h-9 rounded-xl bg-white text-[#0e1419] text-xs font-medium hover:bg-white/90 transition"
        >
          Accepter
        </button>
      </div>
    </div>
  );
}
