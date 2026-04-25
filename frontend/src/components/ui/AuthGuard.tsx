"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/useAuth";
import type { UserRole } from "@/lib/types";

interface AuthGuardProps {
  children: React.ReactNode;
  /** Si fourni, l'utilisateur doit avoir un de ces rôles. */
  roles?: UserRole[];
  /** Route de redirection en cas d'échec. */
  redirectTo?: string;
}

/**
 * Garde côté client. Pour un MVP — pas de SSR redirect, mais simple et suffisant.
 */
export default function AuthGuard({ children, roles, redirectTo = "/auth/login" }: AuthGuardProps) {
  const { authenticated, user, loading, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!authenticated) {
      router.replace(redirectTo);
      return;
    }
    if (roles && roles.length > 0 && user && !hasRole(...roles)) {
      router.replace("/");
    }
  }, [authenticated, loading, user, roles, hasRole, redirectTo, router]);

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
