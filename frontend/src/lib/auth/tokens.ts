import type { AuthTokens, AuthUser } from "@/lib/types";

const KEYS = {
  access: "bet.access_token",
  expiresAt: "bet.expires_at",
  user: "bet.user",
  qrSession: "bet.qr_session_token",
  trackingToken: "bet.tracking_token",
  mustChangePassword: "bet.must_change_password",
} as const;

const isBrowser = () => typeof window !== "undefined";

// ── Auth tokens (JWT — pas de refresh token côté backend, on refresh via /auth/refresh) ──

export function setAuthTokens(tokens: AuthTokens, user?: AuthUser, mustChangePassword?: boolean) {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.access, tokens.access_token);
  localStorage.setItem(
    KEYS.expiresAt,
    String(Date.now() + tokens.expires_in * 1000),
  );
  if (user) localStorage.setItem(KEYS.user, JSON.stringify(user));
  if (typeof mustChangePassword === "boolean") {
    localStorage.setItem(KEYS.mustChangePassword, String(mustChangePassword));
  }
}

export function getAccessToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(KEYS.access);
}

export function getCurrentUser(): AuthUser | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(KEYS.user);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: AuthUser) {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.user, JSON.stringify(user));
}

export function getMustChangePassword(): boolean {
  if (!isBrowser()) return false;
  return localStorage.getItem(KEYS.mustChangePassword) === "true";
}

export function clearMustChangePassword() {
  if (!isBrowser()) return;
  localStorage.removeItem(KEYS.mustChangePassword);
}

export function clearAuth() {
  if (!isBrowser()) return;
  localStorage.removeItem(KEYS.access);
  localStorage.removeItem(KEYS.expiresAt);
  localStorage.removeItem(KEYS.user);
  localStorage.removeItem(KEYS.mustChangePassword);
}

export function isAccessExpired(): boolean {
  if (!isBrowser()) return true;
  const at = localStorage.getItem(KEYS.expiresAt);
  if (!at) return true;
  // -30s de marge pour anticiper le refresh
  return Date.now() >= Number(at) - 30_000;
}

// ── QR scan session token (F1) ────────────────────────────────────────

export function setQrSessionToken(token: string) {
  if (!isBrowser()) return;
  sessionStorage.setItem(KEYS.qrSession, token);
}

export function getQrSessionToken(): string | null {
  if (!isBrowser()) return null;
  return sessionStorage.getItem(KEYS.qrSession);
}

export function clearQrSessionToken() {
  if (!isBrowser()) return;
  sessionStorage.removeItem(KEYS.qrSession);
}

// ── Tracking token (F1.6 — suivi anonyme par téléphone) ───────────────

export function setTrackingToken(token: string) {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.trackingToken, token);
}

export function getTrackingToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(KEYS.trackingToken);
}

export function clearTrackingToken() {
  if (!isBrowser()) return;
  localStorage.removeItem(KEYS.trackingToken);
}
