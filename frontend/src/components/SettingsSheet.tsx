"use client";

import { useEffect, useState } from "react";

interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsSheet({ open, onClose }: SettingsSheetProps) {
  const [visible, setVisible] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (open) {
      setVisible(true);
      requestAnimationFrame(() => setContentVisible(true));
    } else {
      setContentVisible(false);
      const t = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-40">
      <div
        className={`absolute inset-0 bg-black/55 backdrop-blur-md flex flex-col transition-opacity duration-300 ease-out ${
          contentVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Header */}
        <div className="pt-12 px-6 flex items-center shrink-0">
          <button
            onClick={onClose}
            className="ml-auto text-white/60 hover:text-white transition"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" className="w-[24px] h-[24px]">
              <path d="M6 6L18 18M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Titre */}
        <div className="px-6 pt-5 pb-6 shrink-0">
          <span className="text-white/55 text-[0.6rem] font-light tracking-[0.28em] uppercase">
            Mes informations
          </span>
        </div>

        {/* Formulaire */}
        <div className="px-5 pb-8 flex-1 flex flex-col gap-4 overflow-y-auto sheet-scroll">
          {/* Nom */}
          <div className="flex flex-col gap-1.5">
            <span className="text-white/45 text-[0.6rem] font-light tracking-[0.25em] uppercase px-1">
              Nom
            </span>
            <div className="flex items-center gap-3 rounded-xl bg-black/15 px-3.5 h-12 focus-within:bg-rose-500/10 transition">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[16px] h-[16px] text-white/45 shrink-0">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                type="text"
                placeholder="Votre nom"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-transparent text-white placeholder:text-white/35 text-[0.9rem] font-light focus:outline-none"
              />
            </div>
          </div>

          {/* Téléphone */}
          <div className="flex flex-col gap-1.5">
            <span className="text-white/45 text-[0.6rem] font-light tracking-[0.25em] uppercase px-1">
              Téléphone
            </span>
            <div className="flex items-center gap-3 rounded-xl bg-black/15 px-3.5 h-12 focus-within:bg-rose-500/10 transition">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[16px] h-[16px] text-white/45 shrink-0">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.63 19.79 19.79 0 01.22 1 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.29 6.29l1.57-1.57a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
              </svg>
              <input
                type="tel"
                placeholder="+221 ..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 bg-transparent text-white placeholder:text-white/35 text-[0.9rem] font-light focus:outline-none"
              />
            </div>
          </div>

          {/* Bouton enregistrer */}
          <button
            type="button"
            onClick={onClose}
            className="mt-auto h-12 rounded-full bg-rose-500/15 ring-1 ring-rose-400/35 flex items-center justify-center gap-2.5 hover:bg-rose-500/25 hover:ring-rose-400/55 transition"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] text-rose-200">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span className="text-white text-[0.7rem] font-light tracking-[0.25em] uppercase">
              Enregistrer
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
