import { Incident, Agent, computeKPIs } from "../data";

interface KPIBarProps {
  incidents: Incident[];
  agents: Agent[];
}

export default function KPIBar({ incidents, agents }: KPIBarProps) {
  const kpi = computeKPIs(incidents, agents);

  return (
    <div className="h-14 px-6 flex items-center gap-6 border-b border-black/[0.04] bg-white z-10 shrink-0 overflow-x-auto">
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-2 h-2 rounded-full bg-orange-500" />
        <span className="text-xs text-[#6c757d]">Incidents ouverts</span>
        <span className="text-sm font-medium text-[#212529] ml-1">{kpi.open}</span>
      </div>

      <div className="w-px h-4 bg-black/5 shrink-0" />

      <div className="flex items-center gap-2 shrink-0">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <span className="text-xs text-[#6c757d]">Critiques</span>
        <span className={`text-sm font-medium ml-1 ${kpi.critical > 0 ? "text-red-600" : "text-[#212529]"}`}>
          {kpi.critical}
        </span>
      </div>

      <div className="w-px h-4 bg-black/5 shrink-0" />

      <div className="flex items-center gap-2 shrink-0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-[#6c757d]">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span className="text-xs text-[#6c757d]">Prise en charge moy.</span>
        <span className="text-sm font-medium text-[#212529] ml-1">{kpi.avgTime}</span>
      </div>

      <div className="w-px h-4 bg-black/5 shrink-0" />

      <div className="flex items-center gap-2 shrink-0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-[#6c757d]">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87" />
          <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
        <span className="text-xs text-[#6c757d]">Agents dispos</span>
        <span className="text-sm font-medium text-[#212529] ml-1">
          {kpi.availableAgents}
          <span className="text-xs text-[#6c757d] font-light">/{kpi.totalAgents}</span>
        </span>
      </div>

      <div className="w-px h-4 bg-black/5 shrink-0" />

      <div className="flex items-center gap-2 shrink-0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-[#6c757d]">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span className="text-xs text-[#6c757d]">Zones chaudes</span>
        <span className={`text-sm font-medium ml-1 ${kpi.hotZones > 0 ? "text-orange-600" : "text-[#212529]"}`}>
          {kpi.hotZones}
        </span>
      </div>
    </div>
  );
}
