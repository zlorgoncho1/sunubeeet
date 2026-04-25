"use client";

import { useEffect, useState } from "react";
import { getAccessToken, getCurrentUser } from "@/lib/auth/tokens";
import type { AuthUser, UserRole } from "@/lib/types";

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  authenticated: boolean;
  hasRole: (...roles: UserRole[]) => boolean;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getCurrentUser());
    setLoading(false);

    const onStorage = (e: StorageEvent) => {
      if (e.key === "bet.user") setUser(getCurrentUser());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return {
    user,
    loading,
    authenticated: typeof window !== "undefined" && Boolean(getAccessToken()),
    hasRole: (...roles) => Boolean(user && roles.includes(user.role)),
  };
}
