"use client";

import { env } from "@/lib/env";
import { getAccessToken } from "@/lib/auth/tokens";

type Channel = {
  listen: (event: string, callback: (payload: unknown) => void) => Channel;
  stopListening: (event: string) => Channel;
};

interface EchoLike {
  private(channel: string): Channel;
  leave(channel: string): void;
  disconnect(): void;
}

let echoInstance: EchoLike | null = null;
let echoLoading: Promise<EchoLike | null> | null = null;

/**
 * Lazy-load Laravel Echo + Pusher only on the client. Returns null if not configured
 * (so callers gracefully fall back to polling).
 */
export async function getEcho(): Promise<EchoLike | null> {
  if (typeof window === "undefined") return null;
  if (!env.REVERB_APP_KEY) return null;
  if (echoInstance) return echoInstance;
  if (echoLoading) return echoLoading;

  echoLoading = (async () => {
    const [{ default: Echo }, Pusher] = await Promise.all([
      import("laravel-echo"),
      import("pusher-js"),
    ]);

    // Pusher must be available globally for Echo's pusher broadcaster.
    (window as unknown as { Pusher: unknown }).Pusher = Pusher.default;

    const instance = new Echo({
      broadcaster: "reverb",
      key: env.REVERB_APP_KEY,
      wsHost: env.REVERB_HOST,
      wsPort: env.REVERB_PORT,
      wssPort: env.REVERB_PORT,
      forceTLS: env.REVERB_SCHEME === "https",
      enabledTransports: ["ws", "wss"],
      authEndpoint: `${env.API_URL}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: getAccessToken() ? `Bearer ${getAccessToken()}` : "",
        },
      },
    }) as unknown as EchoLike;

    echoInstance = instance;
    return instance;
  })();

  return echoLoading;
}

export function disconnectEcho() {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
    echoLoading = null;
  }
}
