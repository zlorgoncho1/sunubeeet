"use client";

import type { CategoryKey } from "./Step1Categories";

interface SubItem {
  label: string;
  icon: React.ReactNode;
  colorClass: string;
  wide?: boolean;
}

const SUB_CATEGORIES: Record<CategoryKey, SubItem[]> = {
  sante: [
    { label: "Malaise", colorClass: "ring-rose-400/30 text-rose-200", icon: <HeartIcon /> },
    { label: "Blessure", colorClass: "ring-rose-400/30 text-rose-200", icon: <BandageIcon /> },
    { label: "Crise", colorClass: "ring-rose-400/30 text-rose-200", icon: <PulseIcon /> },
    { label: "Coup\nde chaleur", colorClass: "ring-rose-400/30 text-rose-200", icon: <SunIcon /> },
    { label: "Mobilité réduite", colorClass: "ring-rose-400/30 text-rose-200", icon: <UserIcon />, wide: true },
  ],
  securite: [
    { label: "Agression", colorClass: "ring-red-400/30 text-red-200", icon: <AlertCircleIcon /> },
    { label: "Vol", colorClass: "ring-red-400/30 text-red-200", icon: <WalletIcon /> },
    { label: "Comportement\nsuspect", colorClass: "ring-red-400/30 text-red-200", icon: <EyeIcon /> },
    { label: "Objet\nabandonné", colorClass: "ring-red-400/30 text-red-200", icon: <BagIcon /> },
  ],
  foule: [
    { label: "Bousculade", colorClass: "ring-amber-400/30 text-amber-200", icon: <UsersIcon /> },
    { label: "Panique", colorClass: "ring-amber-400/30 text-amber-200", icon: <RunIcon /> },
    { label: "Saturation\nd'accès", colorClass: "ring-amber-400/30 text-amber-200", icon: <TrafficIcon /> },
    { label: "Attroupement\nhostile", colorClass: "ring-amber-400/30 text-amber-200", icon: <UsersIcon /> },
  ],
  acces: [
    { label: "Porte\nbloquée", colorClass: "ring-sky-400/30 text-sky-200", icon: <LockIcon /> },
    { label: "Billetterie", colorClass: "ring-sky-400/30 text-sky-200", icon: <TicketIcon /> },
    { label: "Transport", colorClass: "ring-sky-400/30 text-sky-200", icon: <BusIcon /> },
    { label: "Personne\ncoincée", colorClass: "ring-sky-400/30 text-sky-200", icon: <LiftIcon /> },
  ],
  danger: [
    { label: "Incendie", colorClass: "ring-orange-400/30 text-orange-200", icon: <FireIcon /> },
    { label: "Fuite\nd'eau", colorClass: "ring-orange-400/30 text-orange-200", icon: <DropIcon /> },
    { label: "Électrique", colorClass: "ring-orange-400/30 text-orange-200", icon: <BoltIcon /> },
    { label: "Structure\ndégradée", colorClass: "ring-orange-400/30 text-orange-200", icon: <BuildingIcon /> },
  ],
  perdu: [
    { label: "Enfant\nperdu", colorClass: "ring-violet-400/30 text-violet-200", icon: <UserIcon /> },
    { label: "Adulte\nperdu", colorClass: "ring-violet-400/30 text-violet-200", icon: <UserIcon /> },
    { label: "Objet\nperdu", colorClass: "ring-violet-400/30 text-violet-200", icon: <BagIcon /> },
    { label: "Objet\ntrouvé", colorClass: "ring-violet-400/30 text-violet-200", icon: <BoxIcon /> },
  ],
  autre: [],
};

// ---- Icônes inline SVG ----
function HeartIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M12 21C12 21 3 14.5 3 8.5a4.5 4.5 0 018.26-2.5A4.5 4.5 0 0121 8.5C21 14.5 12 21 12 21z" /></svg>;
}
function BandageIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect x="2" y="8" width="20" height="8" rx="4" /><line x1="12" y1="10" x2="12" y2="14" /><line x1="10" y1="12" x2="14" y2="12" /></svg>;
}
function PulseIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>;
}
function SunIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>;
}
function UserIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
}
function AlertCircleIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;
}
function WalletIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>;
}
function EyeIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;
}
function BagIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /></svg>;
}
function UsersIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>;
}
function RunIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="13" cy="4" r="1" /><path d="M7 21l3-6 2.5 3L15 12l4 4" /><path d="M8 11l2-4 3 2 2-4" /></svg>;
}
function TrafficIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect x="2" y="7" width="20" height="10" rx="2" /><path d="M16 7v10" /><path d="M8 7v10" /></svg>;
}
function LockIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>;
}
function TicketIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M15 5v2M15 11v2M15 17v2M5 5h14a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 000-4V7a2 2 0 012-2z" /></svg>;
}
function BusIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /><path d="M7 21l-1-4M17 21l1-4" /><line x1="6" y1="17" x2="18" y2="17" /></svg>;
}
function LiftIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M20 21v-8a2 2 0 00-2-2H6a2 2 0 00-2 2v8" /><rect x="4" y="3" width="16" height="8" rx="1" /><path d="M8 21v-4h8v4" /></svg>;
}
function FireIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 01-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z" /></svg>;
}
function DropIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" /></svg>;
}
function BoltIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
}
function BuildingIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>;
}
function BoxIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polyline points="20 7 12 3 4 7" /><path d="M4 7l8 4 8-4M4 7v10l8 4 8-4V7" /></svg>;
}

interface Step2Props {
  category: CategoryKey;
  onSelect: (subLabel: string) => void;
}

function normalizeLabel(label: string): string {
  return label.replace(/\n/g, " ").trim().toLowerCase().replace(/\s+/g, "_");
}

export default function Step2SubCategories({ category, onSelect }: Step2Props) {
  const items = SUB_CATEGORIES[category] ?? [];

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {items.map((item) =>
        item.wide ? (
          <button
            key={item.label}
            onClick={() => onSelect(normalizeLabel(item.label))}
            className="col-span-2 h-16 rounded-2xl bg-black/15 ring-1 ring-white/10 flex items-center gap-3 px-4 hover:bg-black/20 hover:ring-white/20 transition"
          >
            <div className={`w-9 h-9 rounded-full ring-1 flex items-center justify-center shrink-0 ${item.colorClass}`}>
              {item.icon}
            </div>
            <span className="text-white text-[0.8rem] font-light">{item.label}</span>
          </button>
        ) : (
          <button
            key={item.label}
            onClick={() => onSelect(normalizeLabel(item.label))}
            className="aspect-square rounded-2xl bg-black/15 ring-1 ring-white/10 flex flex-col items-center justify-center gap-3 p-3 hover:bg-black/20 hover:ring-white/20 transition active:scale-95"
          >
            <div className={`w-11 h-11 rounded-full ring-1 flex items-center justify-center ${item.colorClass}`}>
              {item.icon}
            </div>
            <span className="text-white text-[0.78rem] font-light text-center leading-tight whitespace-pre-line">
              {item.label}
            </span>
          </button>
        )
      )}
    </div>
  );
}
