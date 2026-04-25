"use client";

interface CoordTopBarProps {
  onOpenNotifications?: () => void;
}

export default function CoordTopBar({ onOpenNotifications }: CoordTopBarProps) {
  return (
    <header className="h-14 px-6 flex items-center justify-between border-b border-black/[0.06] bg-white z-20 shrink-0">
      <div className="flex items-center gap-4">
        <h1 className="text-base font-medium tracking-tight text-[#212529]">PC Ops — Dakar 2026</h1>
        <div className="w-px h-4 bg-black/10" />
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-medium text-emerald-700 tracking-tight uppercase">Live</span>
        </div>
      </div>

      <div className="flex items-center gap-5">
        {/* Notifications */}
        <button
          onClick={onOpenNotifications}
          className="relative text-[#6c757d] hover:text-[#212529] transition-colors"
          aria-label="Notifications"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-medium rounded-full ring-2 ring-white">3</span>
        </button>

        <div className="w-px h-5 bg-black/10" />

        {/* Profil */}
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="text-right hidden md:block">
            <div className="text-sm font-medium text-[#212529] leading-none">Amadou Diallo</div>
            <div className="text-xs text-[#6c757d] mt-0.5">Coordinateur PC</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-black/[0.04] border border-black/10 flex items-center justify-center text-xs font-medium text-[#212529]">
            AD
          </div>
        </div>
      </div>
    </header>
  );
}
