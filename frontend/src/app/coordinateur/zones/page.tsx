"use client";

import { useEffect, useState } from "react";
import Sidebar from "../_components/Sidebar";
import CoordTopBar from "../_components/CoordTopBar";
import AuthGuard from "@/components/ui/AuthGuard";
import { adminApi } from "@/lib/api/services/admin";
import type { ApiError, Zone } from "@/lib/types";

export default function ZonesPage() {
  return (
    <AuthGuard
      roles={["admin", "super_admin"]}
      redirectTo="/coordinateur/login"
    >
      <ZonesPageInner />
    </AuthGuard>
  );
}

function ZonesPageInner() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editZone, setEditZone] = useState<Zone | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.zones.list();
      setZones(data ?? []);
    } catch (e) {
      setError((e as ApiError).message ?? "Échec du chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleSave(data: { name: string; description?: string }) {
    try {
      if (editZone) {
        await adminApi.zones.update(editZone.id, data);
      } else {
        await adminApi.zones.create({
          name: data.name,
          description: data.description ?? null,
        });
      }
      setModalOpen(false);
      setEditZone(null);
      await load();
    } catch (e) {
      alert((e as ApiError).message ?? "Échec de l'enregistrement");
    }
  }

  async function handleToggleActive(id: string, currentActive: boolean) {
    if (!confirm(currentActive ? "Désactiver cette zone ?" : "Activer cette zone ?")) return;
    try {
      await adminApi.zones.update(id, { is_active: !currentActive });
      await load();
    } catch (e) {
      alert((e as ApiError).message ?? "Échec");
    }
  }

  return (
    <div className="min-h-screen antialiased text-[#212529] bg-white font-manrope font-light text-sm overflow-hidden flex">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#fcfcfc]">
        <CoordTopBar />

        <div className="px-6 py-5 border-b border-black/[0.04] bg-white flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-lg font-medium tracking-tight text-[#212529]">Zones</h1>
            <p className="text-xs text-[#6c757d] mt-0.5">{zones.length} zone{zones.length > 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={() => {
              setEditZone(null);
              setModalOpen(true);
            }}
            className="px-4 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-black/90 transition shadow-sm"
          >
            + Nouvelle zone
          </button>
        </div>

        <div className="flex-1 overflow-auto coord-scroll p-6">
          {loading ? (
            <p className="text-[#6c757d] text-sm text-center py-10">Chargement…</p>
          ) : error ? (
            <p className="text-rose-500 text-sm text-center py-10">{error}</p>
          ) : zones.length === 0 ? (
            <p className="text-[#6c757d] text-sm text-center py-10">Aucune zone enregistrée.</p>
          ) : (
            <div className="grid gap-3 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  className="bg-white rounded-2xl border border-black/[0.06] p-4 shadow-sm flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-medium text-[#212529]">{zone.name}</div>
                      {zone.code && <div className="text-xs text-[#6c757d] mt-1 font-mono">{zone.code}</div>}
                      {zone.description && <div className="text-xs text-[#6c757d] mt-1">{zone.description}</div>}
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider ${
                        zone.is_active ? "bg-green-50 text-green-600 border-green-100" : "bg-gray-50 text-gray-500 border-gray-100"
                      }`}
                    >
                      {zone.is_active ? "Actif" : "Désactivé"}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => {
                        setEditZone(zone);
                        setModalOpen(true);
                      }}
                      className="flex-1 h-8 rounded-lg bg-black/[0.04] text-xs hover:bg-black/[0.08] transition"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleToggleActive(zone.id, zone.is_active)}
                      className={`flex-1 h-8 rounded-lg text-xs transition ${zone.is_active ? 'text-rose-600 hover:bg-rose-50' : 'text-green-600 hover:bg-green-50'}`}
                    >
                      {zone.is_active ? "Désactiver" : "Activer"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {modalOpen && (
        <ZoneModal
          zone={editZone}
          onClose={() => {
            setModalOpen(false);
            setEditZone(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function ZoneModal({
  zone,
  onClose,
  onSave,
}: {
  zone: Zone | null;
  onClose: () => void;
  onSave: (data: { name: string; description?: string }) => void;
}) {
  const [name, setName] = useState(zone?.name ?? "");
  const [description, setDescription] = useState(zone?.description ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4"
      >
        <h2 className="text-lg font-medium">{zone ? "Modifier la zone" : "Nouvelle zone"}</h2>
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-[#6c757d]">Nom</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full h-10 px-3 rounded-lg border border-black/10 text-sm"
            placeholder="Ex: Entrée Nord"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-[#6c757d]">Description (optionnelle)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm"
          />
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-lg text-sm hover:bg-black/[0.04]"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="h-10 px-4 rounded-lg bg-black text-white text-sm hover:bg-black/90"
          >
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}
