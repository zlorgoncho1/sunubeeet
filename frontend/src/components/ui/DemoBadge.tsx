"use client";

interface DemoBadgeProps {
  visible: boolean;
  label?: string;
  className?: string;
}

/** Petit badge discret pour signaler que la donnée affichée est un fallback (backend 501). */
export default function DemoBadge({ visible, label = "Démo · backend non implémenté", className = "" }: DemoBadgeProps) {
  if (!visible) return null;
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 ring-1 ring-amber-400/30 px-2.5 py-1 text-amber-300 text-[0.6rem] font-light tracking-[0.18em] uppercase ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      {label}
    </div>
  );
}
