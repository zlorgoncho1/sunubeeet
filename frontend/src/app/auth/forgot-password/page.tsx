"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api/services/auth";
import type { ApiError } from "@/lib/types";

type Stage = "phone" | "otp" | "done";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authApi.forgotPassword(phone.trim());
      setStage("otp");
    } catch (e) {
      setError((e as ApiError).message ?? "Échec de l'envoi du code");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authApi.resetPassword({
        phone: phone.trim(),
        otp,
        password,
        password_confirmation: confirm,
      });
      setStage("done");
      setTimeout(() => router.push("/auth/login"), 1800);
    } catch (e) {
      const err = e as ApiError;
      const first = err.errors ? Object.values(err.errors)[0]?.[0] : null;
      setError(first ?? err.message ?? "Échec de la réinitialisation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center mb-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
        <h1 className="text-white text-xl font-medium tracking-tight">Bët</h1>
      </div>

      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-sm">
        {stage === "phone" && (
          <>
            <h2 className="text-white text-base font-medium mb-1">Mot de passe oublié</h2>
            <p className="text-white/45 text-xs mb-6">Un code vous sera envoyé par SMS</p>
            <form onSubmit={handleSendCode} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-white/45 text-[0.6rem] font-light tracking-[0.25em] uppercase px-1">Téléphone</label>
                <div className="flex items-center gap-3 rounded-xl bg-black/20 px-3.5 h-12 focus-within:bg-rose-500/10 border border-white/[0.06] focus-within:border-rose-500/30 transition">
                  <input
                    type="tel"
                    placeholder="+221 77 000 00 00"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 bg-transparent text-white placeholder:text-white/30 text-sm font-light focus:outline-none"
                    required
                  />
                </div>
              </div>
              {error && <p className="text-rose-400 text-xs px-1">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="h-12 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition disabled:opacity-60"
              >
                {loading ? "Envoi…" : "Recevoir le code SMS"}
              </button>
            </form>
          </>
        )}

        {stage === "otp" && (
          <>
            <h2 className="text-white text-base font-medium mb-1">Nouveau mot de passe</h2>
            <p className="text-white/45 text-xs mb-6">Code envoyé au <span className="text-white/70">{phone}</span></p>
            <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-white/45 text-[0.6rem] font-light tracking-[0.25em] uppercase px-1">Code OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="rounded-xl bg-black/20 border border-white/[0.06] px-4 h-12 text-white text-center text-lg tracking-[0.5em] placeholder:text-white/25 focus:outline-none focus:border-rose-500/30 transition"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-white/45 text-[0.6rem] font-light tracking-[0.25em] uppercase px-1">Nouveau mot de passe</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl bg-black/20 border border-white/[0.06] px-3.5 h-12 text-white text-sm font-light placeholder:text-white/30 focus:outline-none focus:border-rose-500/30"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-white/45 text-[0.6rem] font-light tracking-[0.25em] uppercase px-1">Confirmer</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="rounded-xl bg-black/20 border border-white/[0.06] px-3.5 h-12 text-white text-sm font-light placeholder:text-white/30 focus:outline-none focus:border-rose-500/30"
                  required
                />
              </div>
              {error && <p className="text-rose-400 text-xs px-1">{error}</p>}
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="h-12 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition disabled:opacity-60"
              >
                {loading ? "Enregistrement…" : "Réinitialiser le mot de passe"}
              </button>
            </form>
          </>
        )}

        {stage === "done" && (
          <div className="py-4 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-green-500/20 ring-1 ring-green-400/30 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-green-400">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-white text-sm font-medium">Mot de passe réinitialisé</p>
            <p className="text-white/45 text-xs">Redirection vers la connexion…</p>
          </div>
        )}
      </div>

      <p className="text-center text-white/35 text-xs mt-5">
        <Link href="/auth/login" className="text-white/60 hover:text-white transition">
          ← Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
