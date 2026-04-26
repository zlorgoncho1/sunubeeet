"use client";

const TRACKER_LABELS = ["Reçue", "Validée", "Mission assignée", "Agent en route", "Résolue"];

interface AlertTrackerProps {
  stage: number;
  reference?: string;
}

export default function AlertTracker({ stage, reference }: AlertTrackerProps) {
  return (
    <div className="absolute left-5 right-5 rounded-2xl bg-white/10 backdrop-blur-md ring-1 ring-white/10 px-4 pt-3 pb-3.5 transition-all duration-500 ease-out pointer-events-auto"
      style={{ top: "calc(6rem + 1.25rem)" }}
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-white/55 text-[0.55rem] font-light tracking-[0.28em] uppercase">
          Suivi · {reference ?? "AL-2026-0001"}
        </span>
        <span className="text-white/85 text-[0.6rem] font-light tracking-[0.22em] uppercase">
          {TRACKER_LABELS[stage - 1]}
        </span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-[2px] flex-1 rounded-full transition-colors duration-500 ${
              i <= stage ? "bg-white/70" : "bg-white/15"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
