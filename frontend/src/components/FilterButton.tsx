"use client";

const FILTER_CATEGORIES = [
  {
    label: "Santé",
    color: "bg-rose-500/35 ring-rose-400/45 text-rose-100 hover:bg-rose-500/50",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M12 21C12 21 3 14.5 3 8.5a4.5 4.5 0 018.26-2.5A4.5 4.5 0 0121 8.5C21 14.5 12 21 12 21z" />
      </svg>
    ),
  },
  {
    label: "Sécurité",
    color: "bg-teal-600/35 ring-teal-500/45 text-teal-100 hover:bg-teal-600/50",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    label: "Sortie",
    color: "bg-emerald-600/35 ring-emerald-500/45 text-emerald-100 hover:bg-emerald-600/50",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
  },
];

interface FilterButtonProps {
  open: boolean;
}

export default function FilterButton({ open }: FilterButtonProps) {
  return (
    <div
      className={`absolute left-5 z-20 flex flex-col gap-2.5 transition-all duration-300 ease-out ${
        open
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-2 pointer-events-none"
      }`}
      style={{ top: "calc(3rem + 2.75rem + 0.75rem)" }}
    >
      {FILTER_CATEGORIES.map((cat) => (
        <button
          key={cat.label}
          aria-label={cat.label}
          className={`w-11 h-11 rounded-full backdrop-blur-md ring-1 flex items-center justify-center transition-colors ${cat.color}`}
        >
          {cat.icon}
        </button>
      ))}
    </div>
  );
}
