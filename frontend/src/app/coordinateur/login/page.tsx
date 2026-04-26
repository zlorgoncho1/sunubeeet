"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/services/auth";
import type { ApiError } from "@/lib/types";

export default function CoordinateurLoginPage() {
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
      const role = res.user.role;
      if (role !== "coordinator" && role !== "admin" && role !== "super_admin") {
        setError("Accès réservé aux comptes coordinateur, admin ou super-admin.");
        return;
      }
      router.push("/coordinateur");
    } catch (e) {
      const err = e as ApiError;
      setError(err.message ?? "Identifiants invalides");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex antialiased font-manrope font-light text-sm">
      {/* Panneau gauche — branding */}
      <div className="hidden lg:flex flex-col w-[420px] bg-[#0e1419] p-10 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />
        <div className="relative z-10">
          <div className="w-10 h-10 bg-white/10 rounded-xl border border-white/20 flex items-center justify-center mb-8">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <h1 className="text-white text-2xl font-medium tracking-tight mb-2">Bët · PC Ops</h1>
          <p className="text-white/45 text-sm leading-relaxed">
            Plateforme de coordination des incidents<br />JOJ Dakar 2026
          </p>
        </div>
        <div className="relative z-10 mt-auto">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.05] border border-white/[0.08]">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white/60 text-xs">Système opérationnel · Dakar Arena</span>
          </div>
        </div>
      </div>

      {/* Panneau droit — formulaire */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <span className="text-[#212529] font-medium">Bët · PC Ops</span>
          </div>

          <h2 className="text-[#212529] text-xl font-medium tracking-tight mb-1">Connexion coordinateur</h2>
          <p className="text-[#6c757d] text-xs mb-8">Accès réservé aux opérateurs PC Ops</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Téléphone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[#6c757d] text-[0.6rem] font-medium tracking-[0.25em] uppercase px-1">Téléphone</label>
              <div className="flex items-center gap-3 rounded-xl border border-black/10 px-3.5 h-12 focus-within:border-black/30 focus-within:bg-black/[0.01] transition bg-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-[#6c757d] shrink-0">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.63 19.79 19.79 0 01.22 1 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.29 6.29l1.57-1.57a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                </svg>
                <input
                  type="tel"
                  placeholder="+221 77 000 00 00"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 bg-transparent text-[#212529] placeholder:text-[#6c757d]/50 text-sm focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[#6c757d] text-[0.6rem] font-medium tracking-[0.25em] uppercase px-1">Mot de passe</label>
              <div className="flex items-center gap-3 rounded-xl border border-black/10 px-3.5 h-12 focus-within:border-black/30 focus-within:bg-black/[0.01] transition bg-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-[#6c757d] shrink-0">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 bg-transparent text-[#212529] placeholder:text-[#6c757d]/50 text-sm focus:outline-none"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-rose-500 text-xs">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="h-12 rounded-xl bg-black text-white text-sm font-medium hover:bg-black/90 transition disabled:opacity-50 flex items-center justify-center gap-2 mt-2 shadow-sm"
            >
              {loading ? (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0110 10" />
                </svg>
              ) : (
                "Accéder au dashboard"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
