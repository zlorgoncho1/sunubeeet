"use client";

import { useEffect, useState } from "react";
import Sidebar from "../_components/Sidebar";
import CoordTopBar from "../_components/CoordTopBar";
import { MOCK_AGENTS, Agent } from "../data";
import AgentModal from "./_components/AgentModal";
import AuthGuard from "@/components/ui/AuthGuard";
import { usersApi } from "@/lib/api/services/users";
import type { ApiError, User } from "@/lib/types";

export default function AgentsPage() {
  return (
    <AuthGuard
      roles={["coordinator", "admin", "super_admin"]}
      redirectTo="/coordinateur/login"
    >
      <AgentsPageInner />
    </AuthGuard>
  );
}

function mapBackendUserToAgent(u: User): Agent {
  return {
    id: u.id,
    name: u.fullname,
    initials: u.fullname
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    specialty: "Agent",
    status: u.is_active ? "disponible" : "hors_ligne",
    battery: 100,
    coordinates: [-17.4467, 14.6928],
    colorBg: "bg-slate-100",
    colorText: "text-slate-600",
    zone: u.zone_id ?? undefined,
  } as Agent;
}

function AgentsPageInner() {
  const [agents, setAgents] = useState<Agent[]>(MOCK_AGENTS);
  const [modalOpen, setModalOpen] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await usersApi.list({ role: "agent", page: 1 });
        if (cancelled) return;
        setAgents(res.data.map(mapBackendUserToAgent));
      } catch (e) {
        const err = e as ApiError;
        if (!cancelled) setError(err.message ?? "Backend indisponible — données de démo");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const statusLabels: Record<string, string> = {
    disponible: "Disponible",
    en_route: "En route",
    sur_site: "Sur site",
    hors_ligne: "Hors ligne",
  };

  const statusColors: Record<string, string> = {
    disponible: "bg-green-50 text-green-600 border-green-100",
    en_route: "bg-blue-50 text-blue-600 border-blue-100",
    sur_site: "bg-orange-50 text-orange-600 border-orange-100",
    hors_ligne: "bg-gray-50 text-gray-500 border-gray-100",
  };

  const filtered = agents.filter((a) => filterStatus === "all" || a.status === filterStatus);

  async function handleCreate(data: Partial<Agent> & { phone?: string }) {
    try {
      const created = await usersApi.create({
        fullname: data.name ?? "Nouvel agent",
        phone: data.phone ?? "",
        role: "agent",
        zone_id: data.zone ?? null,
      });
      const newAgent: Agent = {
        id: created.id,
        name: data.name ?? "Nouvel agent",
        initials: (data.name ?? "NA").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase(),
        specialty: data.specialty ?? "Général",
        status: "hors_ligne",
        battery: 100,
        coordinates: [-17.4467, 14.6928],
        colorBg: "bg-slate-100",
        colorText: "text-slate-600",
        zone: data.zone,
      };
      setAgents((prev) => [...prev, newAgent]);
    } catch (e) {
      const err = e as ApiError;
      alert(err.message ?? "Création échouée");
    } finally {
      setModalOpen(false);
    }
  }

  async function handleEdit(data: Partial<Agent>) {
    if (!editAgent) return;
    try {
      await usersApi.update(editAgent.id, {
        fullname: data.name,
        zone_id: data.zone ?? null,
      });
      setAgents((prev) =>
        prev.map((a) => (a.id === editAgent.id ? { ...a, ...data } : a)),
      );
    } catch (e) {
      const err = e as ApiError;
      alert(err.message ?? "Mise à jour échouée");
    } finally {
      setEditAgent(null);
      setModalOpen(false);
    }
  }

  async function handleToggleActive(id: string) {
    const target = agents.find((a) => a.id === id);
    if (!target) return;
    const isOffline = target.status === "hors_ligne";
    try {
      if (isOffline) await usersApi.activate(id);
      else await usersApi.deactivate(id);
    } catch {
      // silencieux — UI optimiste
    }
    setAgents((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: a.status === "hors_ligne" ? "disponible" : "hors_ligne" }
          : a,
      ),
    );
  }

  return (
    <div className="min-h-screen antialiased text-[#212529] bg-white font-manrope font-light text-sm overflow-hidden flex">
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#fcfcfc]">
        <CoordTopBar />

        {/* Header */}
        <div className="px-6 py-5 border-b border-black/[0.04] bg-white flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-lg font-medium tracking-tight text-[#212529]">Agents de terrain</h1>
            <p className="text-xs text-[#6c757d] mt-0.5">{agents.length} agents enregistrés</p>
          </div>
          <button
            onClick={() => { setEditAgent(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-black/90 transition shadow-sm"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nouvel agent
          </button>
        </div>

        {/* Filter bar */}
        <div className="px-6 py-3 border-b border-black/[0.04] bg-white flex items-center gap-2 shrink-0 overflow-x-auto">
          {["all", "disponible", "en_route", "sur_site", "hors_ligne"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition whitespace-nowrap ${
                filterStatus === s
                  ? "bg-black text-white border-black"
                  : "bg-white text-[#6c757d] border-black/10 hover:border-black/20"
              }`}
            >
              {s === "all" ? "Tous" : statusLabels[s]}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto coord-scroll">
          <table className="w-full">
            <thead className="sticky top-0 bg-white border-b border-black/[0.04] z-10">
              <tr>
                <th className="text-left px-6 py-3 text-[10px] font-medium text-[#6c757d] uppercase tracking-wider">Agent</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-[#6c757d] uppercase tracking-wider">Spécialité</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-[#6c757d] uppercase tracking-wider">Statut</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-[#6c757d] uppercase tracking-wider">Batterie</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-[#6c757d] uppercase tracking-wider">Zone</th>
                <th className="text-right px-6 py-3 text-[10px] font-medium text-[#6c757d] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((agent) => (
                <tr key={agent.id} className="border-b border-black/[0.03] hover:bg-black/[0.01] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full ${agent.colorBg} ${agent.colorText} flex items-center justify-center text-sm font-medium shrink-0`}>
                        {agent.initials}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[#212529]">{agent.name}</div>
                        <div className="text-xs text-[#6c757d]">{agent.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-[#212529]">{agent.specialty}</td>
                  <td className="px-4 py-4">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded border uppercase tracking-wider ${statusColors[agent.status]}`}>
                      {statusLabels[agent.status]}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-black/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${agent.battery > 50 ? "bg-green-400" : agent.battery > 20 ? "bg-orange-400" : "bg-red-400"}`}
                          style={{ width: `${agent.battery}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#6c757d]">{agent.battery}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-[#6c757d]">{agent.zone ?? "—"}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleActive(agent.id)}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition ${
                          agent.status !== "hors_ligne"
                            ? "text-orange-600 border-orange-200 bg-orange-50 hover:bg-orange-100"
                            : "text-green-600 border-green-200 bg-green-50 hover:bg-green-100"
                        }`}
                      >
                        {agent.status !== "hors_ligne" ? "Désactiver" : "Activer"}
                      </button>
                      <button
                        onClick={() => { setEditAgent(agent); setModalOpen(true); }}
                        className="px-2.5 py-1 rounded-lg border border-black/10 bg-white text-[#212529] text-xs font-medium hover:bg-black/[0.02] transition"
                      >
                        Modifier
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-[#6c757d]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 mb-3 opacity-30">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              <p className="text-sm">Aucun agent dans cette catégorie</p>
            </div>
          )}
        </div>
      </main>

      <AgentModal
        open={modalOpen}
        agent={editAgent}
        onClose={() => { setModalOpen(false); setEditAgent(null); }}
        onSave={editAgent ? handleEdit : handleCreate}
      />
    </div>
  );
}
