"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiError } from "@/lib/types";

interface UseApiState<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
}

interface UseApiResult<T> extends UseApiState<T> {
  refetch: () => Promise<void>;
  setData: (data: T | null) => void;
}

export function useApi<T>(
  loader: () => Promise<T>,
  deps: ReadonlyArray<unknown> = [],
  options: { enabled?: boolean; immediate?: boolean } = {},
): UseApiResult<T> {
  const { enabled = true, immediate = true } = options;
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    error: null,
    loading: immediate && enabled,
  });
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const refetch = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await loaderRef.current();
      setState({ data, error: null, loading: false });
    } catch (e) {
      setState({ data: null, error: e as ApiError, loading: false });
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  return {
    ...state,
    refetch,
    setData: (data) => setState((s) => ({ ...s, data })),
  };
}

export function useMutation<TArgs, TResult>(
  fn: (args: TArgs) => Promise<TResult>,
): {
  mutate: (args: TArgs) => Promise<TResult>;
  loading: boolean;
  error: ApiError | null;
  reset: () => void;
} {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const mutate = useCallback(
    async (args: TArgs) => {
      setLoading(true);
      setError(null);
      try {
        const result = await fn(args);
        setLoading(false);
        return result;
      } catch (e) {
        setError(e as ApiError);
        setLoading(false);
        throw e;
      }
    },
    [fn],
  );

  return {
    mutate,
    loading,
    error,
    reset: () => {
      setError(null);
      setLoading(false);
    },
  };
}
