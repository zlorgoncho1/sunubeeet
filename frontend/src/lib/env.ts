export const env = {
  API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1",
  MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "",
  REVERB_APP_KEY: process.env.NEXT_PUBLIC_REVERB_APP_KEY ?? "",
  REVERB_HOST: process.env.NEXT_PUBLIC_REVERB_HOST ?? "localhost",
  REVERB_PORT: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080),
  REVERB_SCHEME: (process.env.NEXT_PUBLIC_REVERB_SCHEME ?? "http") as "http" | "https",
  POLL_INTERVAL_MS: Number(process.env.NEXT_PUBLIC_POLL_INTERVAL_MS ?? 5000),
  DEFAULT_LAT: Number(process.env.NEXT_PUBLIC_DEFAULT_LAT ?? 14.6928),
  DEFAULT_LNG: Number(process.env.NEXT_PUBLIC_DEFAULT_LNG ?? -17.4467),
};
