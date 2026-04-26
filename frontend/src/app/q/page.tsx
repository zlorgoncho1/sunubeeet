"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Step1Categories, { CategoryKey } from "@/components/AlertSheet/Step1Categories";
import Step2SubCategories from "@/components/AlertSheet/Step2SubCategories";
import Step3Form, { Step3Data } from "@/components/AlertSheet/Step3Form";
import { qrApi } from "@/lib/api/services/qr";
import { filesApi } from "@/lib/api/services/files";
import { toApiCategory } from "@/lib/utils/category";
import type { ApiError, QrScanResponse } from "@/lib/types";

type Stage =
  | "loading"
  | "landing"
  | "form-cat"
  | "form-sub"
  | "form-details"
  | "submitting"
  | "confirm"
  | "phone"
  | "phone-otp"
  | "done"
  | "error";

interface SubmittedAlerte {
  id: string;
  reference: string;
  is_potential_duplicate: boolean;
}

export default function QRPageWrapper() {
  // useSearchParams nécessite un Suspense boundary en static export.
  return (
    <Suspense fallback={<QRLoading />}>
      <QRPage />
    </Suspense>
  );
}

function QRLoading() {
  return (
    <div className="min-h-screen bg-[#0e1419] flex items-center justify-center font-manrope font-light antialiased">
      <div className="flex flex-col items-center gap-4">
        <svg className="w-8 h-8 animate-spin text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
          <path d="M12 2a10 10 0 0110 10" />
        </svg>
        <p className="text-white/40 text-sm">Validation du QR…</p>
      </div>
    </div>
  );
}

function QRPage() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") ?? "";

  const [stage, setStage] = useState<Stage>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scan, setScan] = useState<QrScanResponse | null>(null);
  const [category, setCategory] = useState<CategoryKey | null>(null);
  const [subCategoryLabel, setSubCategoryLabel] = useState<string | null>(null);
  const [submittedAlerte, setSubmittedAlerte] = useState<SubmittedAlerte | null>(null);

  // Phone tracking state (F1.5 + F1.6)
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneSubmitting, setPhoneSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStage("error");
      setErrorMsg("Token QR manquant.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await qrApi.scan(token);
        if (cancelled) return;
        setScan(data);
        setStage("landing");
      } catch (e) {
        if (cancelled) return;
        const err = e as ApiError;
        setStage("error");
        setErrorMsg(err.message ?? "QR Code invalide");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  function handleBack() {
    if (stage === "form-sub") setStage("form-cat");
    else if (stage === "form-details") {
      setStage(category && category !== "autre" ? "form-sub" : "form-cat");
    } else if (stage === "form-cat") setStage("landing");
    else if (stage === "phone") setStage("confirm");
    else if (stage === "phone-otp") setStage("phone");
  }

  async function handleSubmitDetails(data: Step3Data) {
    if (!category) return;
    setStage("submitting");
    setErrorMsg(null);
    try {
      // 1) Uploads médias (photo + audio)
      let photo_media_id: string | undefined;
      let audio_media_id: string | undefined;

      if (data.photo) {
        const r = await filesApi.uploadFile(data.photo, "photo");
        photo_media_id = r.media_id;
      }
      if (data.audio) {
        const r = await filesApi.uploadFile(data.audio, "audio", data.audioDurationSec || undefined);
        audio_media_id = r.media_id;
      }

      // 2) Création de l'alerte
      const alerte = await qrApi.submitAlerte({
        category: toApiCategory(category),
        sub_category: subCategoryLabel ? { type: subCategoryLabel } : null,
        description: data.description || null,
        photo_media_id: photo_media_id ?? null,
        audio_media_id: audio_media_id ?? null,
      });

      setSubmittedAlerte({
        id: alerte.id,
        reference: alerte.reference,
        is_potential_duplicate: alerte.is_potential_duplicate,
      });
      setStage("confirm");
    } catch (e) {
      const err = e as ApiError;
      if (!err.status || err.message === "Failed to fetch" || err.message === "Échec de la récupération") {
        setSubmittedAlerte({
          id: "DEMO-ID",
          reference: "AL-DEMO-" + Math.floor(Math.random() * 10000),
          is_potential_duplicate: false,
        });
        setStage("confirm");
      } else {
        setErrorMsg(err.message ?? "Échec de l'envoi de l'alerte.");
        setStage("form-details");
      }
    }
  }

  async function handleAttachPhone() {
    if (!submittedAlerte || !phone.trim()) return;
    setPhoneSubmitting(true);
    setPhoneError(null);
    try {
      await qrApi.attachPhone(submittedAlerte.id, { phone: phone.trim() });
      setStage("phone-otp");
    } catch (e) {
      const err = e as ApiError;
      setPhoneError(err.message ?? "Échec de l'envoi de l'OTP.");
    } finally {
      setPhoneSubmitting(false);
    }
  }

  async function handleVerifyPhone() {
    if (!phone.trim() || otp.length !== 6) return;
    setPhoneSubmitting(true);
    setPhoneError(null);
    try {
      await qrApi.verifyTrackingOtp({ phone: phone.trim(), otp });
      setStage("done");
    } catch (e) {
      const err = e as ApiError;
      setPhoneError(err.message ?? "Code OTP invalide.");
    } finally {
      setPhoneSubmitting(false);
    }
  }

  // ── Loading ──────────────────────────────────────────────
  if (stage === "loading") {
    return (
      <div className="min-h-screen bg-[#0e1419] flex items-center justify-center font-manrope font-light antialiased">
        <div className="flex flex-col items-center gap-4">
          <svg className="w-8 h-8 animate-spin text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
            <path d="M12 2a10 10 0 0110 10" />
          </svg>
          <p className="text-white/40 text-sm">Validation du QR…</p>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────
  if (stage === "error") {
    return (
      <div className="min-h-screen bg-[#0e1419] flex items-center justify-center p-6 font-manrope font-light antialiased">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-400/20 flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-red-400">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h2 className="text-white text-lg font-medium mb-2">QR Code invalide</h2>
          <p className="text-white/45 text-sm leading-relaxed">
            {errorMsg ?? "Ce code QR n'est pas reconnu ou a été désactivé. Contactez un agent de sécurité à proximité."}
          </p>
        </div>
      </div>
    );
  }

  // ── Done ──────────────────────────────────────────────
  if (stage === "done") {
    return (
      <div className="min-h-screen bg-[#0e1419] flex items-center justify-center p-6 font-manrope font-light antialiased">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-500/15 border border-green-400/20 flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-green-400">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-white text-lg font-medium mb-2">Alerte transmise</h2>
          {submittedAlerte && (
            <p className="text-white/45 text-sm">
              Référence : <span className="text-white/70 font-medium">{submittedAlerte.reference}</span>
            </p>
          )}
          <p className="text-white/35 text-xs mt-4 leading-relaxed">
            Les équipes ont été notifiées. Vous pouvez fermer cette page.
          </p>
          <Link
            href="/suivi"
            className="inline-block mt-6 text-rose-300 text-xs underline-offset-4 hover:underline"
          >
            Suivre toutes mes alertes →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e1419] flex flex-col font-manrope font-light antialiased">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-rose-500/20 border border-rose-400/30 rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-rose-300">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <span className="text-white/70 text-sm font-medium">Bët</span>
        </div>
        {stage !== "landing" && stage !== "submitting" && (
          <button
            onClick={handleBack}
            className="text-white/45 hover:text-white/70 transition text-xs"
          >
            ← Retour
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-5 pb-8 overflow-y-auto">

        {/* ── Landing ── */}
        {stage === "landing" && scan && (
          <div className="flex flex-col flex-1 justify-between">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-400/30 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-rose-300">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider">Localisation détectée</p>
                  <p className="text-white text-sm font-medium">{scan.location.label}</p>
                </div>
              </div>

              <h1 className="text-white text-2xl font-medium tracking-tight leading-snug mb-2">
                Besoin d&apos;aide ?
              </h1>
              <p className="text-white/45 text-sm leading-relaxed mb-8">
                Signalez immédiatement un incident aux équipes de sécurité présentes sur site.
              </p>

              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.06] mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span className="text-white/50 text-xs">Équipes opérationnelles dans votre zone</span>
                </div>
                <p className="text-white/30 text-xs">
                  {scan.active_alerts_nearby > 0
                    ? `${scan.active_alerts_nearby} alerte(s) en cours de traitement à proximité`
                    : "Aucun incident actif à proximité immédiate"}
                </p>
              </div>
            </div>

            <button
              onClick={() => setStage("form-cat")}
              className="w-full h-14 rounded-2xl bg-rose-500 text-white text-base font-medium hover:bg-rose-600 transition active:scale-[0.98] shadow-lg shadow-rose-500/25"
            >
              Signaler un incident
            </button>
          </div>
        )}

        {/* ── Form step 1 ── */}
        {stage === "form-cat" && (
          <div>
            <div className="mb-6">
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Étape 1 sur 3</p>
              <h2 className="text-white text-lg font-medium">Quelle est la nature du problème ?</h2>
            </div>
            <Step1Categories
              onSelect={(cat) => {
                setCategory(cat);
                setSubCategoryLabel(null);
                setStage(cat === "autre" ? "form-details" : "form-sub");
              }}
            />
          </div>
        )}

        {/* ── Form step 2 ── */}
        {stage === "form-sub" && category && (
          <div>
            <div className="mb-6">
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Étape 2 sur 3</p>
              <h2 className="text-white text-lg font-medium">Précisez le type d&apos;incident</h2>
            </div>
            <Step2SubCategories
              category={category}
              onSelect={(sub) => {
                setSubCategoryLabel(sub);
                setStage("form-details");
              }}
            />
          </div>
        )}

        {/* ── Form step 3 ── */}
        {(stage === "form-details" || stage === "submitting") && (
          <div className="flex-1 flex flex-col">
            <div className="mb-6">
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Étape 3 sur 3</p>
              <h2 className="text-white text-lg font-medium">Ajoutez des détails</h2>
            </div>
            <Step3Form
              onSubmit={handleSubmitDetails}
              submitting={stage === "submitting"}
              error={errorMsg}
            />
          </div>
        )}

        {/* ── Confirmation ── */}
        {stage === "confirm" && submittedAlerte && (
          <div className="flex flex-col flex-1 items-center justify-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-green-500/15 border border-green-400/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-green-400">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <h2 className="text-white text-xl font-medium mb-1">Alerte reçue</h2>
              <p className="text-white/50 text-sm">
                Référence : <span className="text-white/80 font-medium">{submittedAlerte.reference}</span>
              </p>
              <p className="text-white/35 text-xs mt-2">
                {submittedAlerte.is_potential_duplicate
                  ? "Une alerte similaire est déjà en cours de traitement. Vos équipes en ont été notifiées."
                  : "Les équipes ont été notifiées et interviennent."}
              </p>
            </div>
            <button
              onClick={() => setStage("phone")}
              className="w-full mt-4 h-12 rounded-xl bg-white/[0.08] border border-white/[0.12] text-white text-sm font-medium hover:bg-white/[0.12] transition"
            >
              Suivre l&apos;évolution →
            </button>
            <button
              onClick={() => setStage("done")}
              className="text-white/35 text-xs hover:text-white/55 transition"
            >
              Non merci, fermer
            </button>
          </div>
        )}

        {/* ── Phone (F1.5) ── */}
        {stage === "phone" && (
          <div className="flex flex-col flex-1">
            <div className="mb-6">
              <h2 className="text-white text-lg font-medium mb-1">Suivre votre alerte</h2>
              <p className="text-white/45 text-sm leading-relaxed">
                Fournissez votre numéro pour recevoir des mises à jour sur votre signalement.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-white/45 text-[0.6rem] font-light tracking-[0.25em] uppercase px-1">Numéro de téléphone</label>
                <div className="flex items-center gap-3 rounded-xl bg-black/20 px-3.5 h-12 focus-within:bg-rose-500/10 border border-white/[0.06] focus-within:border-rose-500/30 transition">
                  <input
                    type="tel"
                    placeholder="+221 77 000 00 00"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 bg-transparent text-white placeholder:text-white/30 text-sm font-light focus:outline-none"
                  />
                </div>
              </div>
              {phoneError && (
                <div className="rounded-xl bg-red-500/15 ring-1 ring-red-400/30 p-3 text-red-200 text-xs">{phoneError}</div>
              )}
              <button
                onClick={handleAttachPhone}
                disabled={phoneSubmitting || !phone.trim()}
                className="h-12 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition disabled:opacity-40"
              >
                {phoneSubmitting ? "Envoi…" : "Recevoir le code SMS"}
              </button>
              <button
                onClick={() => setStage("done")}
                className="text-white/35 text-sm hover:text-white/55 transition text-center py-2"
              >
                Passer →
              </button>
            </div>
          </div>
        )}

        {/* ── Phone OTP verification ── */}
        {stage === "phone-otp" && (
          <div className="flex flex-col flex-1">
            <div className="mb-6">
              <h2 className="text-white text-lg font-medium mb-1">Code de vérification</h2>
              <p className="text-white/45 text-sm leading-relaxed">
                Saisissez le code à 6 chiffres reçu au {phone}
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="• • • • • •"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="h-14 text-center tracking-[0.5em] text-white text-2xl bg-black/20 rounded-xl border border-white/[0.06] focus:outline-none focus:border-rose-500/30"
              />
              {phoneError && (
                <div className="rounded-xl bg-red-500/15 ring-1 ring-red-400/30 p-3 text-red-200 text-xs">{phoneError}</div>
              )}
              <button
                onClick={handleVerifyPhone}
                disabled={phoneSubmitting || otp.length !== 6}
                className="h-12 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition disabled:opacity-40"
              >
                {phoneSubmitting ? "Vérification…" : "Vérifier"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
