"use client";

import { useEffect, useState } from "react";
import Sidebar from "../_components/Sidebar";
import CoordTopBar from "../_components/CoordTopBar";
import AuthGuard from "@/components/ui/AuthGuard";
import { sitesApi } from "@/lib/api/services/sites";
import { SITE_TYPE_LABELS } from "@/lib/i18n/labels";
import type { ApiError, Site, SiteType } from "@/lib/types";

export default function SitesPage() {
  return (
    <AuthGuard
      roles={["coordinator", "admin", "super_admin"]}
      redirectTo="/coordinateur/login"
    >
      <SitesPageInner />
    </AuthGuard>
  );
}

const TYPES: SiteType[] = [
  "police",
  "commissariat",
  "gendarmerie",
  "hopital",
  "clinique",
  "samu",
  "pompiers",
  "protection_civile",
  "point_secours",
  "evenement_pc",
  "depannage",
  "point_eau",
  "point_repos",
  "site_evenement",
  "autre",
];

function SitesPageInner() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editSite, setEditSite] = useState<Site | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await sitesApi.list({ page: 1 });
      setSites(res.data ?? []);
    } catch (e) {
      setError((e as ApiError).message ?? "Échec du chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleSave(data: Partial<Site> & { name: string; type: SiteType; latitude: number; longitude: number }) {
    try {
      if (editSite) {
        await sitesApi.update(editSite.id, data);
      } else {
        await sitesApi.create({
          name: data.name,
          type: data.type,
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.address ?? null,
          phone: data.phone ?? null,
          description: data.description ?? null,
        });
      }
      setModalOpen(false);
      setEditSite(null);
      await load();
    } catch (e) {
      alert((e as ApiError).message ?? "Échec de l'enregistrement");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Désactiver ce site ?")) return;
    try {
      await sitesApi.destroy(id);
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
            <h1 className="text-lg font-medium tracking-tight text-[#212529]">Sites & agents tiers</h1>
            <p className="text-xs text-[#6c757d] mt-0.5">{sites.length} site{sites.length > 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={() => {
              setEditSite(null);
              setModalOpen(true);
            }}
            className="px-4 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-black/90 transition shadow-sm"
          >
            + Nouveau site
          </button>
        </div>

        <div className="flex-1 overflow-auto coord-scroll p-6">
          {loading ? (
            <p className="text-[#6c757d] text-sm text-center py-10">Chargement…</p>
          ) : error ? (
            <p className="text-rose-500 text-sm text-center py-10">{error}</p>
          ) : sites.length === 0 ? (
            <p className="text-[#6c757d] text-sm text-center py-10">Aucun site enregistré.</p>
          ) : (
            <div className="grid gap-3 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {sites.map((site) => (
                <div
                  key={site.id}
                  className="bg-white rounded-2xl border border-black/[0.06] p-4 shadow-sm flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-[#6c757d]">
                        {SITE_TYPE_LABELS[site.type]}
                      </div>
                      <div className="text-sm font-medium text-[#212529]">{site.name}</div>
                      {site.address && <div className="text-xs text-[#6c757d] mt-1">{site.address}</div>}
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider ${
                        site.is_active ? "bg-green-50 text-green-600 border-green-100" : "bg-gray-50 text-gray-500 border-gray-100"
                      }`}
                    >
                      {site.is_active ? "Actif" : "Désactivé"}
                    </span>
                  </div>
                  {site.phone && (
                    <a href={`tel:${site.phone}`} className="text-xs text-blue-600 hover:underline">
                      {site.phone}
                    </a>
                  )}
                  <div className="text-[11px] text-[#6c757d]">
                    {site.latitude.toFixed(5)}, {site.longitude.toFixed(5)}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        setEditSite(site);
                        setModalOpen(true);
                      }}
                      className="flex-1 h-8 rounded-lg bg-black/[0.04] text-xs hover:bg-black/[0.08] transition"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(site.id)}
                      className="flex-1 h-8 rounded-lg text-rose-600 text-xs hover:bg-rose-50 transition"
                    >
                      Désactiver
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {modalOpen && (
        <SiteModal
          site={editSite}
          onClose={() => {
            setModalOpen(false);
            setEditSite(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function SiteModal({
  site,
  onClose,
  onSave,
}: {
  site: Site | null;
  onClose: () => void;
  onSave: (data: { name: string; type: SiteType; latitude: number; longitude: number; address?: string; phone?: string; description?: string }) => void;
}) {
  const [name, setName] = useState(site?.name ?? "");
  const [type, setType] = useState<SiteType>(site?.type ?? "point_secours");
  const [latitude, setLatitude] = useState(String(site?.latitude ?? "14.6928"));
  const [longitude, setLongitude] = useState(String(site?.longitude ?? "-17.4467"));
  const [address, setAddress] = useState(site?.address ?? "");
  const [phone, setPhone] = useState(site?.phone ?? "");
  const [description, setDescription] = useState(site?.description ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      name: name.trim(),
      type,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      address: address.trim() || undefined,
      phone: phone.trim() || undefined,
      description: description.trim() || undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 flex flex-col gap-4 max-h-[90vh] overflow-auto"
      >
        <h2 className="text-lg font-medium">{site ? "Modifier le site" : "Nouveau site"}</h2>
        <Field label="Nom">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full h-10 px-3 rounded-lg border border-black/10 text-sm"
          />
        </Field>
        <Field label="Type">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as SiteType)}
            className="w-full h-10 px-3 rounded-lg border border-black/10 text-sm"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {SITE_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Latitude">
            <input
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-lg border border-black/10 text-sm"
            />
          </Field>
          <Field label="Longitude">
            <input
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-lg border border-black/10 text-sm"
            />
          </Field>
        </div>
        <Field label="Adresse">
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-black/10 text-sm"
          />
        </Field>
        <Field label="Téléphone">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-black/10 text-sm"
          />
        </Field>
        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm"
          />
        </Field>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] uppercase tracking-wider text-[#6c757d]">{label}</span>
      {children}
    </div>
  );
}
