"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/services/auth";
import type { ApiError } from "@/lib/types";

export default function AgentLoginPage() {
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
      if (res.user.role !== "agent") {
        setError("Accès réservé aux comptes agent.");
        return;
      }
      router.push("/agent");
    } catch (e) {
      const err = e as ApiError;
      setError(err.message ?? "Identifiants invalides");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0e1419] flex items-center justify-center p-4 antialiased font-manrope font-light">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-blue-500/20 border border-blue-400/30 rounded-2xl flex items-center justify-center mb-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-blue-300">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 className="text-white text-xl font-medium tracking-tight">Agent Terrain</h1>
          <p className="text-white/40 text-xs mt-1 tracking-wide">Bët · JOJ Dakar 2026</p>
        </div>

        <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-sm">
          <h2 className="text-white text-base font-medium mb-1">Connexion</h2>
          <p className="text-white/45 text-xs mb-6">Accès réservé aux agents de terrain</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-white/45 text-[0.6rem] font-light tracking-[0.25em] uppercase px-1">Téléphone</label>
              <div className="flex items-center gap-3 rounded-xl bg-black/20 px-3.5 h-12 focus-within:bg-blue-500/10 border border-white/[0.06] focus-within:border-blue-500/30 transition">
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

            <div className="flex flex-col gap-1.5">
              <label className="text-white/45 text-[0.6rem] font-light tracking-[0.25em] uppercase px-1">Mot de passe</label>
              <div className="flex items-center gap-3 rounded-xl bg-black/20 px-3.5 h-12 focus-within:bg-blue-500/10 border border-white/[0.06] focus-within:border-blue-500/30 transition">
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

            {error && (
              <p className="text-rose-400 text-xs px-1">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="h-12 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
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

          <p className="text-white/30 text-[10px] text-center mt-5 leading-relaxed">
            Compte créé par un coordinateur.<br />
            Contactez votre responsable PC Ops si vous n&apos;avez pas d&apos;accès.
          </p>
        </div>
      </div>
    </div>
  );
}
