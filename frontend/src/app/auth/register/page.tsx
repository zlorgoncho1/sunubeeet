"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api/services/auth";
import type { ApiError } from "@/lib/types";

type Stage = "form" | "otp";

export default function RegisterPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("form");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authApi.registerSpectator({
        fullname: fullName.trim(),
        phone: phone.trim(),
        password,
      });
      setStage("otp");
    } catch (e) {
      const err = e as ApiError;
      const first = err.errors ? Object.values(err.errors)[0]?.[0] : null;
      setError(first ?? err.message ?? "Échec de la création du compte");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    setError("");
    setLoading(true);
    try {
      await authApi.verifyPhone({ phone: phone.trim(), otp });
      // Vérification OK — l'utilisateur peut maintenant se connecter avec ses identifiants
      const res = await authApi.login({ phone: phone.trim(), password });
      router.push(res.user.role === "agent" ? "/agent" : "/");
    } catch (e) {
      const err = e as ApiError;
      setError(err.message ?? "Code OTP invalide");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center mb-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
        <h1 className="text-white text-xl font-medium tracking-tight">Bët</h1>
        <p className="text-white/40 text-xs mt-1 tracking-wide">JOJ Dakar 2026</p>
      </div>

      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-sm">
        <h2 className="text-white text-base font-medium mb-1">
          {stage === "form" ? "Créer un compte" : "Vérifier votre numéro"}
        </h2>
        <p className="text-white/45 text-xs mb-6">
          {stage === "form"
            ? "Spectateur · Accès à la plateforme d'alerte"
            : `Saisissez le code à 6 chiffres reçu au ${phone}`}
        </p>

        {stage === "otp" ? (
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
            {error && <p className="text-rose-400 text-xs px-1">{error}</p>}
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={loading || otp.length !== 6}
              className="h-12 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition disabled:opacity-60"
            >
              {loading ? "Vérification…" : "Vérifier et se connecter"}
            </button>
            <button
              type="button"
              onClick={() => setStage("form")}
              className="text-white/45 text-xs hover:text-white/65 transition"
            >
              ← Modifier mes informations
            </button>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Nom */}
          <div className="flex flex-col gap-1.5">
            <label className="text-white/45 text-[0.6rem] font-light tracking-[0.25em] uppercase px-1">Nom complet</label>
            <div className="flex items-center gap-3 rounded-xl bg-black/20 px-3.5 h-12 focus-within:bg-rose-500/10 border border-white/[0.06] focus-within:border-rose-500/30 transition">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white/40 shrink-0">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                type="text"
                placeholder="Aminata Diallo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="flex-1 bg-transparent text-white placeholder:text-white/30 text-sm font-light focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Téléphone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-white/45 text-[0.6rem] font-light tracking-[0.25em] uppercase px-1">Téléphone</label>
            <div className="flex items-center gap-3 rounded-xl bg-black/20 px-3.5 h-12 focus-within:bg-rose-500/10 border border-white/[0.06] focus-within:border-rose-500/30 transition">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white/40 shrink-0">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.63 19.79 19.79 0 01.22 1 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.29 6.29l1.57-1.57a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
              </svg>
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

          {/* Mot de passe */}
          <div className="flex flex-col gap-1.5">
            <label className="text-white/45 text-[0.6rem] font-light tracking-[0.25em] uppercase px-1">Mot de passe</label>
            <div className="flex items-center gap-3 rounded-xl bg-black/20 px-3.5 h-12 focus-within:bg-rose-500/10 border border-white/[0.06] focus-within:border-rose-500/30 transition">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white/40 shrink-0">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-transparent text-white placeholder:text-white/30 text-sm font-light focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Confirmation */}
          <div className="flex flex-col gap-1.5">
            <label className="text-white/45 text-[0.6rem] font-light tracking-[0.25em] uppercase px-1">Confirmer le mot de passe</label>
            <div className="flex items-center gap-3 rounded-xl bg-black/20 px-3.5 h-12 focus-within:bg-rose-500/10 border border-white/[0.06] focus-within:border-rose-500/30 transition">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white/40 shrink-0">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              <input
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="flex-1 bg-transparent text-white placeholder:text-white/30 text-sm font-light focus:outline-none"
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-rose-400 text-xs px-1">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-12 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0110 10" />
              </svg>
            ) : (
              "Créer mon compte"
            )}
          </button>
        </form>
        )}
      </div>

      <p className="text-center text-white/35 text-xs mt-5">
        Déjà un compte ?{" "}
        <Link href="/auth/login" className="text-white/60 hover:text-white transition">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
