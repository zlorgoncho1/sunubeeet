"use client";

import { useState } from "react";
import Link from "next/link";
import { qrApi } from "@/lib/api/services/qr";
import { ALERTE_STATUS_LABELS, CATEGORY_LABELS } from "@/lib/i18n/labels";
import type { Alerte, ApiError } from "@/lib/types";
import { getTrackingToken } from "@/lib/auth/tokens";

type Stage = "phone" | "otp" | "list";
type AlerteSummary = Pick<Alerte, "id" | "reference" | "category" | "status" | "created_at">;

export default function SuiviPage() {
  const [stage, setStage] = useState<Stage>(getTrackingToken() ? "list" : "phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alertes, setAlertes] = useState<AlerteSummary[]>([]);
  const [listLoaded, setListLoaded] = useState(false);

  async function handleRequestOtp() {
    setLoading(true);
    setError(null);
    try {
      await qrApi.requestTrackingOtp(phone.trim());
      setStage("otp");
    } catch (e) {
      setError((e as ApiError).message ?? "Erreur d'envoi du code");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setLoading(true);
    setError(null);
    try {
      await qrApi.verifyTrackingOtp({ phone: phone.trim(), otp });
      setStage("list");
      await loadAlertes();
    } catch (e) {
      setError((e as ApiError).message ?? "Code OTP invalide");
    } finally {
      setLoading(false);
    }
  }

  async function loadAlertes() {
    setLoading(true);
    try {
      const list = await qrApi.listTrackedAlertes();
      setAlertes(list);
      setListLoaded(true);
    } catch (e) {
      setError((e as ApiError).message ?? "Impossible de charger les alertes");
    } finally {
      setLoading(false);
    }
  }

  // Auto-charge si déjà un tracking token
  if (stage === "list" && !listLoaded && !loading) {
    loadAlertes();
  }

  return (
    <div className="min-h-screen bg-[#0e1419] flex flex-col font-manrope font-light antialiased">
      <div className="px-5 pt-12 pb-4 flex items-center justify-between border-b border-white/[0.06]">
        <Link href="/" className="text-white/45 hover:text-white text-xs">
          ← Accueil
        </Link>
        <h1 className="text-white text-base font-medium">Suivi de mes alertes</h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 flex flex-col px-5 py-6 max-w-md mx-auto w-full">
        {stage === "phone" && (
          <div className="flex flex-col gap-4 mt-4">
            <p className="text-white/55 text-sm leading-relaxed">
              Entrez le numéro associé à vos alertes pour recevoir un code SMS.
            </p>
            <div className="flex flex-col gap-1.5">
              <label className="text-white/45 text-[0.6rem] tracking-[0.25em] uppercase px-1">
                Numéro de téléphone
              </label>
              <input
                type="tel"
                placeholder="+221 77 000 00 00"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded-xl bg-black/20 border border-white/[0.06] h-12 px-3.5 text-white text-sm focus:outline-none focus:border-rose-500/30"
              />
            </div>
            {error && <p className="text-rose-400 text-xs">{error}</p>}
            <button
              onClick={handleRequestOtp}
              disabled={loading || !phone.trim()}
              className="h-12 rounded-xl bg-rose-500 text-white text-sm hover:bg-rose-600 disabled:opacity-50"
            >
              {loading ? "Envoi…" : "Recevoir le code"}
            </button>
          </div>
        )}

        {stage === "otp" && (
          <div className="flex flex-col gap-4 mt-4">
            <p className="text-white/55 text-sm">
              Saisissez le code envoyé au {phone}
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="• • • • • •"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="h-14 text-center tracking-[0.5em] text-white text-2xl bg-black/20 rounded-xl border border-white/[0.06] focus:outline-none focus:border-rose-500/30"
            />
            {error && <p className="text-rose-400 text-xs">{error}</p>}
            <button
              onClick={handleVerify}
              disabled={loading || otp.length !== 6}
              className="h-12 rounded-xl bg-rose-500 text-white text-sm hover:bg-rose-600 disabled:opacity-50"
            >
              {loading ? "Vérification…" : "Voir mes alertes"}
            </button>
            <button
              onClick={() => setStage("phone")}
              className="text-white/45 text-xs hover:text-white/70"
            >
              ← Modifier le numéro
            </button>
          </div>
        )}

        {stage === "list" && (
          <div className="flex flex-col gap-3 mt-4">
            {loading && !listLoaded ? (
              <p className="text-white/40 text-sm text-center py-10">Chargement…</p>
            ) : alertes.length === 0 ? (
              <p className="text-white/40 text-sm text-center py-10">
                Aucune alerte associée à ce numéro.
              </p>
            ) : (
              alertes.map((a) => (
                <div
                  key={a.id}
                  className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-4"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/50 text-[10px]">{a.reference}</span>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border bg-white/[0.06] border-white/10 text-white/70">
                      {ALERTE_STATUS_LABELS[a.status]}
                    </span>
                  </div>
                  <p className="text-white/80 text-sm font-medium">
                    {CATEGORY_LABELS[a.category]}
                  </p>
                  <p className="text-white/35 text-xs mt-1">
                    {new Date(a.created_at).toLocaleString("fr-FR")}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
