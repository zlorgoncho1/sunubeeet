import { api } from "@/lib/api/client";
import type {
  AgentPresence,
  ApiResponse,
  DashboardKPIs,
  Incident,
  User,
} from "@/lib/types";

export interface AgentLive extends AgentPresence {
  user: Pick<User, "id" | "fullname" | "phone" | "role" | "team_id">;
  active_mission_id: string | null;
}

export const dashboardApi = {
  async kpis(): Promise<DashboardKPIs> {
    const res = await api.get<ApiResponse<DashboardKPIs>>("/dashboard/kpis");
    return res.data;
  },

  async incidentsLive(query?: { zone_id?: string }): Promise<Incident[]> {
    const res = await api.get<ApiResponse<Incident[]>>("/dashboard/incidents/live", {
      query,
    });
    return res.data;
  },

  async agentsLive(query?: { zone_id?: string }): Promise<AgentLive[]> {
    const res = await api.get<ApiResponse<AgentLive[]>>("/dashboard/agents/live", {
      query,
    });
    return res.data;
  },
};
