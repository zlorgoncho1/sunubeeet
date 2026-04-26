"use client";

import { useEffect, useState } from "react";
import { Agent } from "../../data";

interface Props {
  open: boolean;
  agent: Agent | null;
  onClose: () => void;
  onSave: (data: Partial<Agent>) => void;
}

const SPECIALTIES = [
  "Secourisme",
  "Sécurité",
  "Médecin",
  "Infirmier",
  "Logistique",
  "Général",
];

const ZONES = ["Zone Nord", "Zone Sud", "Zone Est", "Zone Ouest", "Zone VIP", "Zone Terrain"];

export default function AgentModal({ open, agent, onClose, onSave }: Props) {
  const [visible, setVisible] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState(SPECIALTIES[0]);
  const [zone, setZone] = useState(ZONES[0]);

  useEffect(() => {
    if (open) {
      setName(agent?.name ?? "");
      setPhone("");
      setSpecialty(agent?.specialty ?? SPECIALTIES[0]);
      setZone(agent?.zone ?? ZONES[0]);
      setVisible(true);
      requestAnimationFrame(() => setContentVisible(true));
    } else {
      setContentVisible(false);
      const t = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(t);
    }
  }, [open, agent]);

  if (!visible) return null;

  function handleSave() {
    onSave({ name, specialty, zone });
  }

  return (
    <div
      className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center transition-opacity duration-200 ${
        contentVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col transition-all duration-200 ${
          contentVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-2"
        }`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between shrink-0">
          <h2 className="text-base font-medium tracking-tight text-[#212529]">
            {agent ? "Modifier l'agent" : "Nouvel agent"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/[0.04] text-[#6c757d] transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-5 h-5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="p-6 flex flex-col gap-4">
          {/* Nom */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[#6c757d] text-[10px] font-medium uppercase tracking-wider px-1">Nom complet</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dr. Moussa Fall"
              className="rounded-xl border border-black/10 bg-black/[0.01] px-3.5 h-11 text-sm text-[#212529] placeholder:text-[#6c757d]/50 focus:outline-none focus:ring-1 focus:ring-black/20"
            />
          </div>

          {/* Téléphone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[#6c757d] text-[10px] font-medium uppercase tracking-wider px-1">Téléphone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+221 77 000 00 00"
              className="rounded-xl border border-black/10 bg-black/[0.01] px-3.5 h-11 text-sm text-[#212529] placeholder:text-[#6c757d]/50 focus:outline-none focus:ring-1 focus:ring-black/20"
            />
          </div>

          {/* Spécialité */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[#6c757d] text-[10px] font-medium uppercase tracking-wider px-1">Spécialité</label>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="rounded-xl border border-black/10 bg-white px-3.5 h-11 text-sm text-[#212529] focus:outline-none focus:ring-1 focus:ring-black/20 appearance-none"
            >
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Zone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[#6c757d] text-[10px] font-medium uppercase tracking-wider px-1">Zone assignée</label>
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="rounded-xl border border-black/10 bg-white px-3.5 h-11 text-sm text-[#212529] focus:outline-none focus:ring-1 focus:ring-black/20 appearance-none"
            >
              {ZONES.map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-black/5 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[#6c757d] hover:text-[#212529] transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-5 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-black/90 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {agent ? "Enregistrer" : "Créer l'agent"}
          </button>
        </div>
      </div>
    </div>
  );
}
