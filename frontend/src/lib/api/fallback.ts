import type { ApiError } from "@/lib/types";

/**
 * Helper qui retourne la valeur réelle si l'endpoint répond,
 * et `fallback` si le backend n'est pas encore implémenté (501)
 * ou si la connexion échoue (network error). Pratique tant que
 * certains controllers backend sont en stub `Not implemented`.
 */
export async function withFallback<T>(
  loader: () => Promise<T>,
  fallback: T,
): Promise<{ value: T; usedFallback: boolean; error: ApiError | null }> {
  try {
    const value = await loader();
    return { value, usedFallback: false, error: null };
  } catch (e) {
    const err = e as ApiError;
    if (err?.status === 501 || err?.status === 0 || err?.status === undefined) {
      return { value: fallback, usedFallback: true, error: err };
    }
    return { value: fallback, usedFallback: true, error: err };
  }
}

export function isNotImplemented(error: ApiError | null | undefined): boolean {
  return error?.status === 501;
}
