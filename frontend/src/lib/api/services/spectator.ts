import { api } from "@/lib/api/client";
import type { ApiResponse, Incident } from "@/lib/types";

export const spectatorApi = {
  async incidentsNearby(query: { lat: number; lng: number; radius?: number }): Promise<Incident[]> {
    const res = await api.get<ApiResponse<Incident[]>>(
      "/spectator/map/incidents-nearby",
      { query },
    );
    return res.data;
  },
};
