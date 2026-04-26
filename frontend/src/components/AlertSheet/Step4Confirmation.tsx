"use client";

import { useState } from "react";

interface Step4Props {
  onFinish: () => void;
}

export default function Step4Confirmation({ onFinish }: Step4Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return (
      <div className="flex flex-col items-center text-center pt-4">
        <div className="w-16 h-16 rounded-full ring-1 ring-emerald-400/35 flex items-center justify-center text-emerald-300 mb-5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h2 className="text-white text-[1.05rem] font-light tracking-tight mb-2">Signalement bien reçu</h2>
        <p className="text-white/55 text-[0.82rem] font-light leading-relaxed px-2 max-w-[18rem]">
          Patientez tranquillement,<br />nos équipes interviennent.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center">
      {/* Icône validation */}
      <div className="w-16 h-16 rounded-full ring-1 ring-emerald-400/35 flex items-center justify-center text-emerald-300 mt-2 mb-5">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>

      <h2 className="text-white text-[1.05rem] font-light tracking-tight mb-2">
        Signalement bien reçu
      </h2>

      <p className="text-white/55 text-[0.82rem] font-light leading-relaxed px-2 max-w-[18rem]">
        Patientez tranquillement,<br />nos équipes interviennent.
      </p>

      {/* Séparateur wolof */}
      <div className="flex items-center gap-3 mt-5 mb-6 w-full">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-white/55 text-[0.7rem] font-light tracking-[0.18em] italic">
          Bul tiit, ñu ngi ñów
        </span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      {/* Identification optionnelle */}
      <div className="w-full rounded-2xl bg-black/15 p-4 pt-3.5 flex flex-col gap-2.5 relative text-left">
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 text-white/55 hover:text-white transition"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" className="w-[18px] h-[18px]">
            <path d="M6 6L18 18M18 6L6 18" />
          </svg>
        </button>

        <span className="text-white/45 text-[0.55rem] font-light tracking-[0.25em] uppercase pr-9 leading-snug">
          Identifiez-vous pour suivre l'intervention
        </span>

        <div className="flex items-center gap-3 rounded-xl bg-black/20 px-3.5 h-11 mt-1 focus-within:bg-rose-500/10 transition">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px] text-white/45 shrink-0">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
          <input
            type="text"
            placeholder="Nom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder:text-white/35 text-[0.85rem] font-light focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-black/20 px-3.5 h-11 focus-within:bg-rose-500/10 transition">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px] text-white/45 shrink-0">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.63 19.79 19.79 0 01.22 1 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.29 6.29l1.57-1.57a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
          </svg>
          <input
            type="tel"
            placeholder="+221 ..."
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder:text-white/35 text-[0.85rem] font-light focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={onFinish}
          className="mt-1.5 h-10 rounded-full bg-rose-500/15 ring-1 ring-rose-400/35 flex items-center justify-center gap-2 hover:bg-rose-500/25 hover:ring-rose-400/55 transition"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px] text-rose-200">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span className="text-white text-[0.62rem] font-light tracking-[0.22em] uppercase">
            Confirmer
          </span>
        </button>
      </div>
    </div>
  );
}
