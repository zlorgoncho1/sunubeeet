"use client";

import { useEffect, useState } from "react";
import { Agent, MOCK_AGENTS } from "../data";

interface DispatchModalProps {
  open: boolean;
  incidentId: string | null;
  preselectedAgentId?: string | null;
  agents?: Agent[];
  onClose: () => void;
  onConfirm: (agentId: string, note: string) => void;
}

export default function DispatchModal({
  open,
  incidentId,
  preselectedAgentId = null,
  agents = MOCK_AGENTS,
  onClose,
  onConfirm,
}: DispatchModalProps) {
  const [visible, setVisible] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(preselectedAgentId);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setSelectedAgentId(preselectedAgentId);
      setNote("");
      setVisible(true);
      requestAnimationFrame(() => setContentVisible(true));
    } else {
      setContentVisible(false);
      const t = setTimeout(() => setVisible(false), 250);
      return () => clearTimeout(t);
    }
  }, [open, preselectedAgentId]);

  if (!visible) return null;

  function handleConfirm() {
    if (!selectedAgentId) return;
    onConfirm(selectedAgentId, note);
  }

  const availableAgents = agents.filter((a) => a.status === "disponible");

  return (
    <div
      className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center transition-opacity duration-200 ${
        contentVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col transition-all duration-200 ${
          contentVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-2"
        }`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-medium tracking-tight text-[#212529]">Dispatcher Mission</h2>
            {incidentId && (
              <p className="text-xs text-[#6c757d] mt-0.5">Incident {incidentId}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/[0.04] text-[#6c757d] transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-5 h-5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6 flex flex-col gap-5 overflow-y-auto coord-scroll max-h-[60vh]">

          {/* Sélection agent */}
          <div>
            <h3 className="text-[10px] font-medium text-[#6c757d] uppercase tracking-wider mb-3">Choisir un Agent Disponible</h3>
            {availableAgents.length === 0 ? (
              <p className="text-sm text-[#6c757d]">Aucun agent disponible pour le moment.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {availableAgents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgentId(agent.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      selectedAgentId === agent.id
                        ? "border-black bg-black/[0.02] ring-1 ring-black/10"
                        : "border-black/[0.06] hover:border-black/20 hover:bg-black/[0.01]"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-full ${agent.colorBg} ${agent.colorText} flex items-center justify-center text-sm font-medium shrink-0`}>
                      {agent.initials}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-[#212529]">{agent.name}</div>
                      <div className="text-xs text-[#6c757d]">{agent.specialty} · {agent.battery}% batterie</div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      selectedAgentId === agent.id ? "border-black bg-black" : "border-black/20"
                    }`}>
                      {selectedAgentId === agent.id && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Note opérationnelle */}
          <div>
            <h3 className="text-[10px] font-medium text-[#6c757d] uppercase tracking-wider mb-2">Note Opérationnelle</h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Instructions spécifiques pour l'agent…"
              rows={3}
              className="w-full rounded-xl border border-black/10 bg-black/[0.01] px-3.5 py-3 text-sm text-[#212529] placeholder:text-[#6c757d]/60 focus:outline-none focus:ring-1 focus:ring-black/20 resize-none font-light"
            />
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
            onClick={handleConfirm}
            disabled={!selectedAgentId}
            className="px-5 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-black/90 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Confirmer la mission
          </button>
        </div>
      </div>
    </div>
  );
}
