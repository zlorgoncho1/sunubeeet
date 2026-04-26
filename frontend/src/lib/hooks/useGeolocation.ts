"use client";

import { useEffect, useState } from "react";
import { env } from "@/lib/env";

export interface GeoState {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
}

/**
 * Geolocation simple avec fallback sur la coordonnée par défaut configurée.
 */
export function useGeolocation(opts: { watch?: boolean; fallback?: boolean } = {}): GeoState {
  const { watch = false, fallback = true } = opts;
  const [state, setState] = useState<GeoState>({
    latitude: env.DEFAULT_LAT,
    longitude: env.DEFAULT_LNG,
    accuracy: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setState((s) => ({ ...s, loading: false, error: "Geolocation indisponible" }));
      return;
    }

    const onSuccess = (pos: GeolocationPosition) => {
      setState({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        loading: false,
        error: null,
      });
    };
    const onError = (err: GeolocationPositionError) => {
      setState((s) => ({
        ...s,
        loading: false,
        error: err.message,
        latitude: fallback ? env.DEFAULT_LAT : s.latitude,
        longitude: fallback ? env.DEFAULT_LNG : s.longitude,
      }));
    };

    if (watch) {
      const id = navigator.geolocation.watchPosition(onSuccess, onError, {
        enableHighAccuracy: true,
        maximumAge: 5000,
      });
      return () => navigator.geolocation.clearWatch(id);
    }
    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      maximumAge: 30000,
      timeout: 10000,
    });
  }, [watch, fallback]);

  return state;
}
