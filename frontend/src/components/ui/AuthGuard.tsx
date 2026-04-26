"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken, getCurrentUser } from "@/lib/auth/tokens";
import type { AuthUser, UserRole } from "@/lib/types";

interface AuthGuardProps {
  children: React.ReactNode;
  /** Si fourni, l'utilisateur doit avoir un de ces rôles. */
  roles?: UserRole[];
  /** Route de redirection en cas d'échec. */
  redirectTo?: string;
}

/**
 * Garde côté client. Pour un MVP — pas de SSR redirect, mais simple et suffisant.
 *
 * État d'authentification lu directement depuis lib/auth/tokens. Pas de hook
 * useAuth partagé : la logique est inline (≈10 lignes), réutilisée par
 * historique/page.tsx selon le même pattern.
 */
export default function AuthGuard({ children, roles, redirectTo = "/auth/login" }: AuthGuardProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setUser(getCurrentUser());
    setLoading(false);

    const onStorage = (e: StorageEvent) => {
      if (e.key === "bet.user") setUser(getCurrentUser());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const authenticated = typeof window !== "undefined" && Boolean(getAccessToken());
  const hasRole = (...allowed: UserRole[]) => Boolean(user && allowed.includes(user.role));

  useEffect(() => {
    if (loading) return;
    if (!authenticated) {
      router.replace(redirectTo);
      return;
    }
    if (roles && roles.length > 0 && user && !hasRole(...roles)) {
      router.replace("/");
    }
    // hasRole est dérivé de `user` — on n'inclut pas dans les deps pour éviter
    // une nouvelle référence à chaque render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, loading, user, roles, redirectTo, router]);

  if (loading || !authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/40 text-sm">
        Chargement…
      </div>
    );
  }
  if (roles && user && !hasRole(...roles)) return null;
  return <>{children}</>;
}
