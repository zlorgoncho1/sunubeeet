"use client";

import { useEffect, useState } from "react";
import Step1Categories, { type CategoryKey } from "./Step1Categories";
import Step2SubCategories from "./Step2SubCategories";
import Step3Form, { type Step3Data } from "./Step3Form";
import Step4Confirmation from "./Step4Confirmation";
import { alertesApi } from "@/lib/api/services/alertes";
import { filesApi } from "@/lib/api/services/files";
import { toApiCategory } from "@/lib/utils/category";
import type { ApiError } from "@/lib/types";

const STEP_TITLES = ["Catégorie", "Sous-catégorie", "Détails", "Confirmation"];
const CAT_LABELS: Record<CategoryKey, string> = {
  sante: "Santé",
  securite: "Sécurité",
  foule: "Foule",
  acces: "Accès / Logistique",
  danger: "Danger matériel",
  perdu: "Perdu / Trouvé",
  autre: "Autre",
};

export interface AlertSubmission {
  reference: string;
  is_potential_duplicate: boolean;
}

interface AlertSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmitted: (result: AlertSubmission) => void;
  /** Position GPS courante du spectateur (F2 — vient du device GPS). */
  position: { latitude: number; longitude: number } | null;
}

export default function AlertSheet({ open, onClose, onSubmitted, position }: AlertSheetProps) {
  const [visible, setVisible] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<CategoryKey | null>(null);
  const [subCategoryLabel, setSubCategoryLabel] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setVisible(true);
      requestAnimationFrame(() => setContentVisible(true));
    } else {
      setContentVisible(false);
      const t = setTimeout(() => {
        setVisible(false);
        setStep(1);
        setCategory(null);
        setSubCategoryLabel(null);
        setSubmitError(null);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!visible) return null;

  function handleSelectCategory(cat: CategoryKey) {
    setCategory(cat);
    setSubCategoryLabel(null);
    setStep(cat === "autre" ? 3 : 2);
  }

  function handleBack() {
    if (step === 3) {
      setStep(category === "autre" ? 1 : 2);
    } else if (step === 2) {
      setStep(1);
    }
  }

  async function handleDetailsSubmit(data: Step3Data) {
    if (!category) return;
    if (!position) {
      setSubmitError("Position GPS indisponible. Activez la localisation pour signaler une alerte.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      let photo_media_id: string | undefined;
      let audio_media_id: string | undefined;

      if (data.photo) {
        const r = await filesApi.uploadFile(data.photo, "photo");
        photo_media_id = r.media_id;
      }
      if (data.audio) {
        const r = await filesApi.uploadFile(
          data.audio,
          "audio",
          data.audioDurationSec || undefined,
        );
        audio_media_id = r.media_id;
      }

      const alerte = await alertesApi.create({
        category: toApiCategory(category),
        sub_category: subCategoryLabel ? { type: subCategoryLabel } : null,
        description: data.description || null,
        latitude: position.latitude,
        longitude: position.longitude,
        photo_media_id: photo_media_id ?? null,
        audio_media_id: audio_media_id ?? null,
      });

      setStep(4);
      onSubmitted({
        reference: alerte.reference,
        is_potential_duplicate: alerte.is_potential_duplicate,
      });
    } catch (e) {
      const err = e as ApiError;
      if (!err.status || err.message === "Failed to fetch" || err.message === "Échec de la récupération") {
        // Mode démo (backend éteint)
        setStep(4);
        onSubmitted({
          reference: "AL-DEMO-" + Math.floor(Math.random() * 10000),
          is_potential_duplicate: false,
        });
      } else {
        setSubmitError(err.message ?? "Échec de l'envoi de l'alerte");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const showBack = step !== 1 && step !== 4;
  const totalSteps = 4;

  const stepTitle =
    step === 2 && category ? CAT_LABELS[category] : STEP_TITLES[step - 1];

  return (
    <div className="fixed inset-0 z-40">
      <div
        className={`absolute inset-0 bg-black/55 backdrop-blur-md flex flex-col transition-opacity duration-300 ease-out ${
          contentVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Header */}
        <div className="pt-12 px-6 flex items-center shrink-0">
          {showBack ? (
            <button
              onClick={handleBack}
              className="text-white/60 hover:text-white transition"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
                <path d="M19 12L5 12M11 6L5 12L11 18" />
              </svg>
            </button>
          ) : (
            <div className="w-[22px]" />
          )}
          <button
            onClick={onClose}
            className="ml-auto text-white/60 hover:text-white transition"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" className="w-[24px] h-[24px]">
              <path d="M6 6L18 18M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Barre de progression */}
        <div className="px-6 pt-5 flex gap-1.5 shrink-0">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-[2px] flex-1 rounded-full transition-colors duration-300 ${
                i + 1 <= step ? "bg-white/65" : "bg-white/15"
              }`}
            />
          ))}
        </div>

        {/* Titre étape */}
        <div className="px-6 pt-5 pb-4 shrink-0">
          <span className="text-white/55 text-[0.6rem] font-light tracking-[0.28em] uppercase">
            {stepTitle}
          </span>
        </div>

        {/* Contenu scrollable */}
        <div className="px-5 pb-8 overflow-y-auto sheet-scroll flex-1">
          {step === 1 && (
            <Step1Categories onSelect={handleSelectCategory} />
          )}
          {step === 2 && category && category !== "autre" && (
            <Step2SubCategories
              category={category}
              onSelect={(sub) => {
                setSubCategoryLabel(sub);
                setStep(3);
              }}
            />
          )}
          {step === 3 && (
            <Step3Form
              onSubmit={handleDetailsSubmit}
              submitting={submitting}
              error={submitError}
            />
          )}
          {step === 4 && (
            <Step4Confirmation onFinish={onClose} />
          )}
        </div>
      </div>
    </div>
  );
}
