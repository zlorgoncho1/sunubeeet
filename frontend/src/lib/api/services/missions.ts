import { api } from "@/lib/api/client";
import type { ApiResponse, Mission, MissionServiceInfo } from "@/lib/types";

export interface AssignMissionPayload {
  incident_id: string;
  agent_id: string;
  briefing?: string | null;
  service_infos?: { site_id: string; reason?: string | null }[];
}

export const missionsApi = {
  // ── Lecture ──────────────────────────────────────────────
  async list(query?: {
    status?: string;
    agent_id?: string;
    incident_id?: string;
    page?: number;
  }): Promise<Mission[]> {
    const res = await api.get<ApiResponse<Mission[]>>("/missions", { query });
    return res.data;
  },

  async show(id: string): Promise<Mission> {
    const res = await api.get<ApiResponse<Mission>>(`/missions/${id}`);
    return res.data;
  },

  async serviceInfos(id: string): Promise<MissionServiceInfo[]> {
    const res = await api.get<ApiResponse<MissionServiceInfo[]>>(
      `/missions/${id}/service-infos`,
    );
    return res.data;
  },

  // F3 — espace personnel
  async myActive(): Promise<Mission | null> {
    const res = await api.get<ApiResponse<Mission | null>>("/me/missions/active");
    return res.data;
  },

  // ── Lifecycle agent (F3.6) ───────────────────────────────
  async accept(id: string): Promise<Mission> {
    const res = await api.post<ApiResponse<Mission>>(`/missions/${id}/accept`);
    return res.data;
  },

  async refuse(id: string, reason: string): Promise<Mission> {
    const res = await api.post<ApiResponse<Mission>>(`/missions/${id}/refuse`, { reason });
    return res.data;
  },

  async onRoute(id: string, position?: { latitude: number; longitude: number }): Promise<Mission> {
    const res = await api.post<ApiResponse<Mission>>(`/missions/${id}/on-route`, position);
    return res.data;
  },

  async onSite(id: string, position?: { latitude: number; longitude: number }): Promise<Mission> {
    const res = await api.post<ApiResponse<Mission>>(`/missions/${id}/on-site`, position);
    return res.data;
  },

  async complete(
    id: string,
    payload: { outcome: string; note?: string | null },
  ): Promise<Mission> {
    const res = await api.post<ApiResponse<Mission>>(`/missions/${id}/complete`, payload);
    return res.data;
  },

  async requestReinforcement(id: string, note?: string): Promise<Mission> {
    const res = await api.post<ApiResponse<Mission>>(
      `/missions/${id}/request-reinforcement`,
      { note },
    );
    return res.data;
  },

  // ── Coordinator actions ──────────────────────────────────
  async create(payload: AssignMissionPayload): Promise<Mission> {
    const res = await api.post<ApiResponse<Mission>>("/missions", payload);
    return res.data;
  },

  async update(id: string, payload: Partial<AssignMissionPayload>): Promise<Mission> {
    const res = await api.patch<ApiResponse<Mission>>(`/missions/${id}`, payload);
    return res.data;
  },

  async cancel(id: string, reason?: string): Promise<Mission> {
    const res = await api.post<ApiResponse<Mission>>(`/missions/${id}/cancel`, { reason });
    return res.data;
  },

  async reassign(id: string, agent_id: string): Promise<Mission> {
    const res = await api.post<ApiResponse<Mission>>(`/missions/${id}/reassign`, { agent_id });
    return res.data;
  },
};
