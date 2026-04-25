import { api } from "@/lib/api/client";
import type {
  AgentPresenceStatus,
  ApiResponse,
  Incident,
  User,
} from "@/lib/types";

export interface UpdatePresencePayload {
  status: AgentPresenceStatus;
  latitude?: number | null;
  longitude?: number | null;
  battery_level?: number | null;
}

export interface AgentNearby {
  user_id: string;
  fullname: string;
  team_id: string | null;
  status: AgentPresenceStatus;
  latitude: number;
  longitude: number;
  distance_meters: number;
}

export const agentApi = {
  async updatePresence(payload: UpdatePresencePayload): Promise<User> {
    const res = await api.patch<ApiResponse<User>>("/me/presence", payload);
    return res.data;
  },

  async incidentsNearby(query: { lat: number; lng: number; radius?: number }): Promise<Incident[]> {
    const res = await api.get<ApiResponse<Incident[]>>("/agent/map/incidents-nearby", {
      query,
    });
    return res.data;
  },

  async agentsNearby(query: { lat: number; lng: number; radius?: number }): Promise<AgentNearby[]> {
    const res = await api.get<ApiResponse<AgentNearby[]>>("/agent/map/agents-nearby", {
      query,
    });
    return res.data;
  },
};
