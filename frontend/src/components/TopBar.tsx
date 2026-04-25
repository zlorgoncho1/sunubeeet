"use client";

interface TopBarProps {
  onOpenFilters: () => void;
  onOpenNotifications: () => void;
  hasUnread?: boolean;
}

export default function TopBar({ onOpenFilters, onOpenNotifications, hasUnread = true }: TopBarProps) {
  return (
    <>
      {/* Bouton Filtres — haut-gauche */}
      <div className="absolute top-12 left-5 pointer-events-auto">
        <button
          onClick={onOpenFilters}
          aria-label="Filtres"
          className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md ring-1 ring-white/10 flex items-center justify-center text-white hover:bg-white/15 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[19px] h-[19px]">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="8" y1="12" x2="20" y2="12" />
            <line x1="12" y1="18" x2="20" y2="18" />
            <circle cx="6" cy="12" r="2" fill="currentColor" stroke="none" />
            <circle cx="10" cy="18" r="2" fill="currentColor" stroke="none" />
          </svg>
        </button>
      </div>

      {/* Pill centrale — lieu */}
      <div className="flex justify-center">
        <div className="flex items-center gap-2.5 px-4 h-11 rounded-full bg-white/10 backdrop-blur-md ring-1 ring-white/10 pointer-events-auto">
          <span className="text-white text-[0.92rem] font-light tracking-[0.06em] uppercase leading-none">
            DAKAR
          </span>
          <span className="w-1 h-1 rounded-full bg-white/35" />
          <span className="text-white/60 text-[0.62rem] font-light tracking-[0.18em] uppercase leading-none">
            Piscine Olympique
          </span>
        </div>
      </div>

      {/* Bouton notifications (cloche) — haut-droite */}
      <button
        onClick={onOpenNotifications}
        aria-label="Notifications"
        className="absolute top-12 right-5 w-11 h-11 rounded-full bg-white/10 backdrop-blur-md ring-1 ring-white/10 flex items-center justify-center text-white hover:bg-white/15 transition-colors pointer-events-auto"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="w-[21px] h-[21px]">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {hasUnread && (
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-500 ring-2 ring-[#0e1419]/60" />
        )}
      </button>
    </>
  );
}
