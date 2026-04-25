"use client";

import { useEffect, useState } from "react";
import Sidebar from "../_components/Sidebar";
import CoordTopBar from "../_components/CoordTopBar";
import AuthGuard from "@/components/ui/AuthGuard";
import { adminApi } from "@/lib/api/services/admin";
import type { ApiError, QRCode, Zone } from "@/lib/types";

export default function QrCodesPage() {
  return (
    <AuthGuard roles={["admin", "super_admin"]} redirectTo="/coordinateur/login">
      <QrCodesPageInner />
    </AuthGuard>
  );
}

function QrCodesPageInner() {
  const [items, setItems] = useState<QRCode[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Form
  const [label, setLabel] = useState("");
  const [lat, setLat] = useState("14.6928");
  const [lng, setLng] = useState("-17.4467");
  const [zoneId, setZoneId] = useState<string>("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [list, z] = await Promise.all([
        adminApi.qrCodes.list({ page: 1 }),
        adminApi.zones.list().catch(() => [] as Zone[]),
      ]);
      setItems(list.data ?? []);
      setZones(z);
    } catch (e) {
      setError((e as ApiError).message ?? "Échec du chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await adminApi.qrCodes.create({
        location_label: label.trim(),
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        zone_id: zoneId || null,
      });
      setLabel("");
      await load();
    } catch (e) {
      alert((e as ApiError).message ?? "Échec");
    } finally {
      setCreating(false);
    }
  }

  async function handleRotate(id: string) {
    if (!confirm("Régénérer le token ? Les QR imprimés deviendront invalides.")) return;
    try {
      await adminApi.qrCodes.rotate(id);
      await load();
    } catch (e) {
      alert((e as ApiError).message ?? "Échec");
    }
  }

  async function handleDeactivate(id: string) {
    if (!confirm("Désactiver ce QR code ?")) return;
    try {
      await adminApi.qrCodes.deactivate(id);
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
        <div className="px-6 py-5 border-b border-black/[0.04] bg-white shrink-0">
          <h1 className="text-lg font-medium tracking-tight text-[#212529]">QR Codes</h1>
          <p className="text-xs text-[#6c757d] mt-0.5">{items.length} QR enregistré{items.length > 1 ? "s" : ""}</p>
        </div>

        <div className="flex-1 overflow-auto coord-scroll p-6 space-y-6">
          {/* Création rapide */}
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-2xl border border-black/[0.06] p-4 shadow-sm grid grid-cols-1 md:grid-cols-5 gap-3"
          >
            <input
              placeholder="Libellé (ex: Entrée Nord)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              className="md:col-span-2 h-10 px-3 rounded-lg border border-black/10 text-sm"
            />
            <input
              placeholder="Latitude"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              required
              className="h-10 px-3 rounded-lg border border-black/10 text-sm"
            />
            <input
              placeholder="Longitude"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              required
              className="h-10 px-3 rounded-lg border border-black/10 text-sm"
            />
            <select
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              className="h-10 px-3 rounded-lg border border-black/10 text-sm"
            >
              <option value="">— Sans zone —</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={creating}
              className="md:col-span-5 h-10 px-4 rounded-lg bg-black text-white text-sm hover:bg-black/90 disabled:opacity-50"
            >
              {creating ? "Création…" : "+ Nouveau QR Code"}
            </button>
          </form>

          {/* Liste */}
          {loading ? (
            <p className="text-center text-[#6c757d] text-sm">Chargement…</p>
          ) : error ? (
            <p className="text-center text-rose-500 text-sm">{error}</p>
          ) : items.length === 0 ? (
            <p className="text-center text-[#6c757d] text-sm">Aucun QR Code.</p>
          ) : (
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="text-left bg-black/[0.02] border-b border-black/[0.04]">
                    <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-[#6c757d]">Libellé</th>
                    <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-[#6c757d]">Position</th>
                    <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-[#6c757d]">Zone</th>
                    <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-[#6c757d]">Statut</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((qr) => (
                    <tr key={qr.id} className="border-b border-black/[0.04] hover:bg-black/[0.01]">
                      <td className="px-4 py-3 text-sm font-medium">{qr.location_label}</td>
                      <td className="px-4 py-3 text-xs text-[#6c757d] tabular-nums">
                        {qr.latitude.toFixed(5)}, {qr.longitude.toFixed(5)}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#6c757d]">{qr.zone_id ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${
                            qr.is_active
                              ? "bg-green-50 text-green-600 border-green-100"
                              : "bg-gray-50 text-gray-500 border-gray-100"
                          }`}
                        >
                          {qr.is_active ? "Actif" : "Désactivé"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleRotate(qr.id)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Régénérer
                        </button>
                        {qr.is_active && (
                          <button
                            onClick={() => handleDeactivate(qr.id)}
                            className="text-xs text-rose-600 hover:underline"
                          >
                            Désactiver
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
