import { env } from "@/lib/env";
import {
  clearAuth,
  getAccessToken,
  getQrSessionToken,
  getTrackingToken,
  isAccessExpired,
  setAuthTokens,
} from "@/lib/auth/tokens";
import type { ApiError, AuthTokens } from "@/lib/types";

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** auth = "jwt" (default for protected routes), "qr-session", "tracking", or "none" */
  auth?: "jwt" | "qr-session" | "tracking" | "none";
  /** When true the body is sent as FormData (no JSON content-type) */
  multipart?: boolean;
  /** Skip automatic refresh-on-401 cycle (used internally by refresh()). */
  skipRefresh?: boolean;
}

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const base = env.API_URL.replace(/\/$/, "");
  const url = new URL(
    path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`,
  );
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

let refreshPromise: Promise<boolean> | null = null;

async function refresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  const token = getAccessToken();
  if (!token) return false;
  refreshPromise = (async () => {
    try {
      const res = await fetch(buildUrl("/auth/refresh"), {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        clearAuth();
        return false;
      }
      const json = (await res.json()) as { data: AuthTokens & { must_change_password?: boolean } };
      setAuthTokens(
        {
          access_token: json.data.access_token,
          token_type: "bearer",
          expires_in: json.data.expires_in,
        },
        undefined,
        json.data.must_change_password,
      );
      return true;
    } catch {
      clearAuth();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, query, auth = "jwt", multipart, skipRefresh, headers, ...rest } = options;

  if (auth === "jwt" && !skipRefresh && getAccessToken() && isAccessExpired()) {
    await refresh();
  }

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(headers as Record<string, string> | undefined),
  };

  if (auth === "jwt") {
    const token = getAccessToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  } else if (auth === "qr-session") {
    const token = getQrSessionToken();
    if (token) finalHeaders["X-Scan-Session"] = token;
  } else if (auth === "tracking") {
    const token = getTrackingToken();
    if (token) finalHeaders["X-Tracking-Token"] = token;
  }

  let payload: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (multipart && body instanceof FormData) {
      payload = body;
    } else {
      finalHeaders["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }
  }

  const res = await fetch(buildUrl(path, query), {
    ...rest,
    headers: finalHeaders,
    body: payload,
  });

  if (res.status === 401 && auth === "jwt" && !skipRefresh) {
    const ok = await refresh();
    if (ok) {
      return apiFetch<T>(path, { ...options, skipRefresh: true });
    }
    clearAuth();
  }

  if (!res.ok) {
    let errBody: Partial<ApiError> & { errors?: Record<string, string[]>; message?: string } = {};
    try {
      errBody = await res.json();
    } catch {
      // ignore
    }
    const err: ApiError = {
      message: errBody.message ?? `HTTP ${res.status}`,
      code: errBody.code,
      errors: errBody.errors,
      status: res.status,
    };
    throw err;
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: "PATCH", body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: "PUT", body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: "DELETE" }),
};

export type { ApiError } from "@/lib/types";
