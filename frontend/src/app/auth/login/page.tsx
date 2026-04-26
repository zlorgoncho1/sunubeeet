"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api/services/auth";
import type { ApiError } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.login({ phone: phone.trim(), password });
      // Routage selon le rôle (le backend du flow App devrait être spectator,
      // mais agent / coordinator peuvent aussi se connecter ici)
      switch (res.user.role) {
        case "agent":
          router.push("/agent");
          break;
        case "coordinator":
        case "admin":
        case "super_admin":
          router.push("/coordinateur");
          break;
        default:
          router.push("/");
      }
    } catch (e) {
      const err = e as ApiError;
      if (err.errors) {
        const first = Object.values(err.errors)[0]?.[0];
        setError(first ?? err.message);
      } else {
        setError(err.message ?? "Échec de la connexion");
      }
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

      {/* Card */}
      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-sm">
        <h2 className="text-white text-base font-medium mb-1">Se connecter</h2>
        <p className="text-white/45 text-xs mb-6">Entrez vos identifiants pour accéder à l&apos;app</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Téléphone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-white/45 text-[0.6rem] font-light tracking-[0.25em] uppercase px-1">
              Téléphone
            </label>
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
            <label className="text-white/45 text-[0.6rem] font-light tracking-[0.25em] uppercase px-1">
              Mot de passe
            </label>
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

          <div className="flex justify-end -mt-1">
            <Link href="/auth/forgot-password" className="text-xs text-white/40 hover:text-white/70 transition">
              Mot de passe oublié ?
            </Link>
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/15 ring-1 ring-red-400/30 p-3 text-red-200 text-xs">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-12 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0110 10" />
              </svg>
            ) : (
              "Se connecter"
            )}
          </button>
        </form>
      </div>

      <p className="text-center text-white/35 text-xs mt-5">
        Pas encore de compte ?{" "}
        <Link href="/auth/register" className="text-white/60 hover:text-white transition">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
