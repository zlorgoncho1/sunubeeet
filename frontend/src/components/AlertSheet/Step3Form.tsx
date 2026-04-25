"use client";

import { useRef, useState } from "react";

export interface Step3Data {
  description: string;
  photo: File | null;
  audio: Blob | null;
  audioDurationSec: number;
}

interface Step3Props {
  onSubmit: (data: Step3Data) => void | Promise<void>;
  submitting?: boolean;
  error?: string | null;
}

export default function Step3Form({ onSubmit, submitting = false, error }: Step3Props) {
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [audio, setAudio] = useState<Blob | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const photoName = photo
    ? photo.name.length > 28
      ? photo.name.slice(0, 25) + "…"
      : photo.name
    : null;

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function startRecording() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      // Pas de support : on simule juste un timer pour démo
      setRecording(true);
      setRecordSeconds(0);
      intervalRef.current = setInterval(() => {
        setRecordSeconds((s) => {
          if (s + 1 >= 60) {
            stopRecording();
            return 60;
          }
          return s + 1;
        });
      }, 1000);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        setAudio(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      recorderRef.current = mr;
      setRecording(true);
      setRecordSeconds(0);
      intervalRef.current = setInterval(() => {
        setRecordSeconds((s) => {
          if (s + 1 >= 60) {
            stopRecording();
            return 60;
          }
          return s + 1;
        });
      }, 1000);
    } catch {
      // L'utilisateur a refusé le micro — on n'enregistre pas
    }
  }

  function stopRecording() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setRecording(false);
  }

  function fmtTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  // Validation : au moins un des trois champs (cf F0.1 règles).
  const hasContent = description.trim().length > 0 || !!photo || !!audio;

  function handleSubmit() {
    if (!hasContent || submitting) return;
    void onSubmit({
      description: description.trim(),
      photo,
      audio,
      audioDurationSec: recordSeconds,
    });
  }

  return (
    <div className="flex flex-col gap-4 min-h-full">
      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <span className="text-white/45 text-[0.6rem] font-light tracking-[0.25em] uppercase px-1">
          Description
        </span>
        <div className="rounded-2xl bg-black/15 p-3.5 flex items-start gap-3 focus-within:bg-rose-500/10 transition">
          <div className="w-9 h-9 rounded-full ring-1 ring-rose-400/25 flex items-center justify-center text-rose-200 shrink-0 mt-0.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <textarea
            rows={4}
            maxLength={300}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez ce que vous voyez…"
            className="flex-1 bg-transparent text-white placeholder:text-white/35 text-[0.88rem] font-light leading-relaxed resize-none focus:outline-none pt-1.5"
          />
        </div>
      </div>

      {/* Photo */}
      <div className="flex flex-col gap-1.5">
        <span className="text-white/45 text-[0.6rem] font-light tracking-[0.25em] uppercase px-1">
          Photo (optionnel)
        </span>
        <button
          type="button"
          onClick={() => photoInputRef.current?.click()}
          className={`rounded-2xl p-3.5 flex items-center gap-3 hover:bg-black/20 transition text-left ${
            photoName
              ? "bg-sky-500/15 ring-1 ring-sky-400/45"
              : "bg-black/15 ring-1 ring-white/10"
          }`}
        >
          <div
            className="w-9 h-9 rounded-full ring-1 ring-sky-400/25 flex items-center justify-center text-sky-200 shrink-0 overflow-hidden"
            style={
              photoPreview
                ? { backgroundImage: `url(${photoPreview})`, backgroundSize: "cover", backgroundPosition: "center" }
                : {}
            }
          >
            {!photoPreview && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            )}
          </div>
          <span className="text-white/75 text-[0.88rem] font-light flex-1 truncate">
            {photoName ?? "Ajouter une photo"}
          </span>
          {photoName ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[19px] h-[19px] text-emerald-300 shrink-0">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[19px] h-[19px] text-white/35 shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          )}
        </button>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handlePhotoChange}
        />
      </div>

      {/* Note vocale */}
      <div className="flex flex-col gap-1.5">
        <span className="text-white/45 text-[0.6rem] font-light tracking-[0.25em] uppercase px-1">
          Note vocale (optionnel)
        </span>
        <button
          type="button"
          onClick={() => (recording ? stopRecording() : startRecording())}
          className={`rounded-2xl p-3.5 flex items-center gap-3 hover:bg-black/20 transition text-left ${
            recording
              ? "bg-rose-500/15 ring-1 ring-rose-400/45"
              : recordSeconds > 0
              ? "bg-rose-500/10 ring-1 ring-rose-400/30"
              : "bg-black/15 ring-1 ring-white/10"
          }`}
        >
          <div
            className={`w-9 h-9 rounded-full ring-1 flex items-center justify-center shrink-0 ${
              recording
                ? "bg-rose-500/60 ring-rose-300/60 text-white animate-pulse"
                : "ring-rose-400/25 text-rose-200"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
              <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
            </svg>
          </div>
          <span className="text-white/75 text-[0.88rem] font-light flex-1">
            {recording
              ? "Enregistrement…"
              : recordSeconds > 0
              ? `Vocal · ${fmtTime(recordSeconds)}`
              : "Toucher pour enregistrer"}
          </span>
          <span className="text-white/40 text-[0.7rem] font-light tabular-nums shrink-0">
            {fmtTime(recordSeconds)}
          </span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/15 ring-1 ring-red-400/30 p-3 text-red-200 text-xs">
          {error}
        </div>
      )}

      {/* Bouton envoi */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!hasContent || submitting}
        className="mt-auto h-12 rounded-full bg-rose-500/15 ring-1 ring-rose-400/35 flex items-center justify-center gap-2.5 hover:bg-rose-500/25 hover:ring-rose-400/55 transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <svg className="w-4 h-4 animate-spin text-rose-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
            <path d="M12 2a10 10 0 0110 10" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] text-rose-200">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        )}
        <span className="text-white text-[0.7rem] font-light tracking-[0.25em] uppercase">
          {submitting ? "Envoi…" : "Envoyer l'alerte"}
        </span>
      </button>
    </div>
  );
}
