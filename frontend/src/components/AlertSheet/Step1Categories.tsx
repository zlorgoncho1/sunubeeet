"use client";

export type CategoryKey =
  | "sante"
  | "securite"
  | "foule"
  | "acces"
  | "danger"
  | "perdu"
  | "autre";

const CATEGORIES: {
  key: CategoryKey;
  label: string;
  icon: React.ReactNode;
  colorClass: string;
}[] = [
  {
    key: "sante",
    label: "Santé",
    colorClass: "bg-rose-500/20 ring-rose-400/25 text-rose-200",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
        <path d="M12 21C12 21 3 14.5 3 8.5a4.5 4.5 0 018.26-2.5A4.5 4.5 0 0121 8.5C21 14.5 12 21 12 21z" />
      </svg>
    ),
  },
  {
    key: "securite",
    label: "Sécurité",
    colorClass: "bg-red-500/20 ring-red-400/25 text-red-200",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
  {
    key: "foule",
    label: "Foule",
    colorClass: "bg-amber-500/20 ring-amber-400/25 text-amber-200",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    key: "acces",
    label: "Accès\nLogistique",
    colorClass: "bg-sky-500/20 ring-sky-400/25 text-sky-200",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    key: "danger",
    label: "Danger\nmatériel",
    colorClass: "bg-orange-500/20 ring-orange-400/25 text-orange-200",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    key: "perdu",
    label: "Perdu\nTrouvé",
    colorClass: "bg-violet-500/20 ring-violet-400/25 text-violet-200",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
];

interface Step1Props {
  onSelect: (cat: CategoryKey) => void;
}

export default function Step1Categories({ onSelect }: Step1Props) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.key}
          onClick={() => onSelect(cat.key)}
          className="aspect-square rounded-2xl bg-black/15 ring-1 ring-white/10 flex flex-col items-center justify-center gap-3 p-3 hover:bg-black/20 hover:ring-white/20 transition active:scale-95"
        >
          <div className={`w-11 h-11 rounded-full ring-1 flex items-center justify-center ${cat.colorClass}`}>
            {cat.icon}
          </div>
          <span className="text-white text-[0.82rem] font-light text-center leading-tight whitespace-pre-line">
            {cat.label}
          </span>
        </button>
      ))}

      {/* Autre — pleine largeur */}
      <button
        onClick={() => onSelect("autre")}
        className="col-span-2 h-16 rounded-2xl bg-black/15 ring-1 ring-white/10 flex items-center justify-center gap-3 px-4 hover:bg-black/20 hover:ring-white/20 transition"
      >
        <div className="w-9 h-9 rounded-full bg-slate-500/25 ring-1 ring-slate-400/25 flex items-center justify-center text-slate-200">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[19px] h-[19px]">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <span className="text-white text-[0.82rem] font-light">Autre</span>
      </button>
    </div>
  );
}
