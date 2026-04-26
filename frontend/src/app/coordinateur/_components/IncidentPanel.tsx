"use client";

import { useState } from "react";
import {
  Incident,
  Agent,
  Site,
  STATUS_LABELS,
  CATEGORY_LABELS,
  MOCK_AGENTS,
  MOCK_SITES,
} from "../data";

const WAVEFORM_HEIGHTS = [1, 2, 3, 2, 4, 1, 2, 1, 3, 2, 1];

type Tab = "details" | "timeline" | "alertes";

interface IncidentPanelProps {
  incident: Incident;
  agents?: Agent[];
  sites?: Site[];
  onDispatch: (agentId?: string) => void;
  onValidate: () => void;
  onMarkDuplicate: () => void;
  onReject: () => void;
  onClose: () => void;
}

export default function IncidentPanel({
  incident,
  agents = MOCK_AGENTS,
  sites = MOCK_SITES,
  onDispatch,
  onValidate,
  onMarkDuplicate,
  onReject,
  onClose,
}: IncidentPanelProps) {
  const [tab, setTab] = useState<Tab>("details");

  const severityClass =
    incident.severity === "critique"
      ? "bg-red-50 text-red-600 border-red-100/50"
      : incident.severity === "élevé"
      ? "bg-orange-50 text-orange-600 border-orange-100/50"
      : incident.severity === "moyen"
      ? "bg-yellow-50 text-yellow-600 border-yellow-100/50"
      : "bg-blue-50 text-blue-600 border-blue-100/50";

  const severityLabel =
    incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1);

  const canDispatch = incident.status === "reçue" || incident.status === "validée";
  const canValidate = incident.status === "reçue";

  return (
    <aside className="w-[420px] bg-white border-l border-black/[0.06] flex flex-col z-20 shrink-0 shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">

      {/* Header */}
      <div className="p-5 border-b border-black/[0.04] shrink-0 bg-black/[0.01]">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded border uppercase tracking-wider ${severityClass}`}>
                {severityLabel}
              </span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-black/[0.04] text-[#6c757d] border border-black/[0.04]">
                {STATUS_LABELS[incident.status]}
              </span>
            </div>
            <h2 className="text-xl font-medium tracking-tight text-[#212529]">{incident.id}</h2>
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

        <div className="flex items-center gap-4 text-xs text-[#6c757d]">
          <div className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <path d="M12 21C12 21 3 14.5 3 8.5a4.5 4.5 0 018.26-2.5A4.5 4.5 0 0121 8.5C21 14.5 12 21 12 21z" />
            </svg>
            {CATEGORY_LABELS[incident.category]}
          </div>
          <div className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {incident.time}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-black/[0.04] px-5 sticky top-0 bg-white z-10 shrink-0">
        {(["details", "timeline", "alertes"] as Tab[]).map((t) => {
          const label = t === "details" ? "Détails" : t === "timeline" ? "Timeline" : "Alertes liées";
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-1 py-3 text-sm font-medium mr-6 transition-colors ${
                tab === t
                  ? "text-[#212529] border-b-2 border-[#212529]"
                  : "text-[#6c757d] hover:text-[#212529]"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto coord-scroll">
        {tab === "details" && (
          <div className="p-5 flex flex-col gap-6">

            {/* Description */}
            <div>
              <h3 className="text-[10px] font-medium text-[#6c757d] uppercase tracking-wider mb-2">Description Initiale</h3>
              <p className="text-sm text-[#212529] leading-relaxed mb-3">&ldquo;{incident.description}&rdquo;</p>

              <div className="flex flex-col gap-2 p-3 rounded-xl bg-black/[0.02] border border-black/[0.04]">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6c757d]">Source</span>
                  <div className="flex items-center gap-1 text-xs font-medium text-[#212529]">
                    {incident.source === "qr" ? (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                          <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="3" height="3" />
                        </svg>
                        QR Code
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                          <rect x="5" y="2" width="14" height="20" rx="2" />
                          <line x1="12" y1="18" x2="12" y2="18" strokeWidth="2" />
                        </svg>
                        Application
                      </>
                    )}
                  </div>
                </div>
                <div className="w-full h-px bg-black/[0.04]" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6c757d]">Point de repère</span>
                  <span className="text-xs font-medium text-[#212529]">{incident.location}</span>
                </div>
              </div>
            </div>

            {/* Médias */}
            <div>
              <h3 className="text-[10px] font-medium text-[#6c757d] uppercase tracking-wider mb-2">Médias joints</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="aspect-video rounded-xl bg-black/5 border border-black/10 overflow-hidden relative group cursor-pointer flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-black/20">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
                      <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                  </div>
                </div>

                <div className="rounded-xl border border-black/10 p-3 flex flex-col justify-between bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    <button className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center shrink-0 hover:bg-black/80 transition-colors">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 ml-0.5">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </button>
                    <div className="flex-1 flex items-end gap-0.5 h-6">
                      {WAVEFORM_HEIGHTS.map((h, i) => (
                        <div key={i} className="w-0.5 bg-black/20 rounded-full" style={{ height: `${h * 4}px` }} />
                      ))}
                    </div>
                    <span className="text-[10px] text-[#6c757d] font-medium">0:14</span>
                  </div>
                  <div className="text-[10px] text-[#6c757d] bg-black/[0.02] p-1.5 rounded leading-tight italic border border-black/[0.03]">
                    &ldquo;Venez vite, quelqu&rsquo;un est tombé à l&rsquo;entrée...&rdquo;
                  </div>
                </div>
              </div>
            </div>

            {/* Agents recommandés */}
            {canDispatch && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[10px] font-medium text-[#6c757d] uppercase tracking-wider">Agents Recommandés</h3>
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">Proximité &amp; Spécialité</span>
                </div>
                <div className="flex flex-col gap-2">
                  {agents.filter((a) => a.status === "disponible").map((agent, idx) => (
                    <div
                      key={agent.id}
                      className={`flex items-center justify-between p-3 rounded-xl border ${
                        idx === 0 ? "border-blue-100 bg-blue-50/30" : "border-black/[0.06] bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className={`w-8 h-8 rounded-full ${agent.colorBg} ${agent.colorText} flex items-center justify-center text-xs font-medium tracking-tight`}>
                            {agent.initials}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-[#212529]">{agent.name}</div>
                          <div className="text-xs text-[#6c757d]">{agent.specialty} · {agent.battery}%</div>
                        </div>
                      </div>
                      <button
                        onClick={() => onDispatch(agent.id)}
                        className="px-3 py-1.5 bg-white border border-black/10 rounded-lg text-xs font-medium text-[#212529] shadow-sm hover:bg-black/5 transition-colors"
                      >
                        Assigner
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sites proches */}
            <div>
              <h3 className="text-[10px] font-medium text-[#6c757d] uppercase tracking-wider mb-2">Sites de Référence Proches</h3>
              {sites.map((site) => (
                <div key={site.id} className="flex items-center justify-between p-3 rounded-xl border border-black/[0.04] bg-black/[0.01]">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-blue-500">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#212529]">{site.name}</div>
                      <div className="text-xs text-[#6c757d]">{site.hours} · {site.distance}</div>
                    </div>
                  </div>
                  <button className="w-8 h-8 rounded border border-black/10 flex items-center justify-center text-[#212529] bg-white hover:bg-black/5 transition-colors">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.63 19.79 19.79 0 01.22 1 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.29 6.29l1.57-1.57a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "timeline" && (
          <div className="p-5 flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-[#212529] mt-1 shrink-0" />
                <div className="w-px flex-1 bg-black/[0.06] mt-1" />
              </div>
              <div className="pb-4">
                <div className="text-xs font-medium text-[#212529]">Alerte reçue</div>
                <div className="text-[10px] text-[#6c757d]">{incident.time} — via {incident.source === "qr" ? incident.location : "Application"}</div>
              </div>
            </div>
            {incident.status !== "reçue" && (
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-orange-400 mt-1 shrink-0" />
                  <div className="w-px flex-1 bg-black/[0.06] mt-1" />
                </div>
                <div className="pb-4">
                  <div className="text-xs font-medium text-[#212529]">Qualifiée en incident</div>
                  <div className="text-[10px] text-[#6c757d]">Coordinateur PC</div>
                </div>
              </div>
            )}
            {incident.status === "mission_assignée" && (
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-400 mt-1 shrink-0" />
                <div>
                  <div className="text-xs font-medium text-[#212529]">Mission assignée</div>
                  <div className="text-[10px] text-[#6c757d]">Agent dispatché</div>
                </div>
              </div>
            )}
            {(incident.status === "reçue" || incident.status === "validée") && (
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-black/20 mt-1 shrink-0" />
                <div>
                  <div className="text-xs text-[#6c757d]">En attente de dispatch…</div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "alertes" && (
          <div className="p-5 text-sm text-[#6c757d]">Aucune alerte liée pour l&rsquo;instant.</div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-black/[0.06] bg-white shrink-0">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <button
            onClick={() => onDispatch()}
            disabled={!canDispatch}
            className="py-2.5 px-4 bg-black text-white rounded-xl text-sm font-medium hover:bg-black/90 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Dispatcher
          </button>
          <button
            onClick={onValidate}
            disabled={!canValidate}
            className="py-2.5 px-4 bg-white border border-black/[0.1] text-[#212529] rounded-xl text-sm font-medium hover:bg-black/[0.02] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Valider Incident
          </button>
        </div>
        <div className="flex justify-center gap-4 text-xs font-medium">
          <button onClick={onMarkDuplicate} className="text-orange-600 hover:text-orange-700 transition-colors">
            Marquer doublon
          </button>
          <button onClick={onReject} className="text-[#6c757d] hover:text-[#212529] transition-colors">
            Rejeter (Fausse alerte)
          </button>
        </div>
      </div>
    </aside>
  );
}
