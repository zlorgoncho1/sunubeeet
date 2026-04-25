import { api } from "@/lib/api/client";
import type {
  ApiResponse,
  Incident,
  IncidentStatus,
  Priority,
  Severity,
} from "@/lib/types";

export interface IncidentListQuery {
  status?: IncidentStatus | IncidentStatus[];
  category?: string;
  severity?: Severity;
  zone_id?: string;
  page?: number;
  per_page?: number;
}

export interface UpdateIncidentPayload {
  severity?: Severity;
  priority?: Priority;
  title?: string | null;
  description?: string | null;
  status?: IncidentStatus;
}

export const incidentsApi = {
  async list(query?: IncidentListQuery): Promise<Incident[]> {
    const flatQuery: Record<string, string | number | boolean | undefined> = {};
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (Array.isArray(v)) flatQuery[k] = v.join(",");
        else if (v !== undefined && v !== null) flatQuery[k] = v as string | number | boolean;
      }
    }
    const res = await api.get<ApiResponse<Incident[]>>("/incidents", { query: flatQuery });
    return res.data;
  },

  async show(id: string): Promise<Incident> {
    const res = await api.get<ApiResponse<Incident>>(`/incidents/${id}`);
    return res.data;
  },

  async update(id: string, payload: UpdateIncidentPayload): Promise<Incident> {
    const res = await api.patch<ApiResponse<Incident>>(`/incidents/${id}`, payload);
    return res.data;
  },

  async resolve(id: string, note?: string): Promise<Incident> {
    const res = await api.post<ApiResponse<Incident>>(`/incidents/${id}/resolve`, { note });
    return res.data;
  },

  async close(id: string): Promise<Incident> {
    const res = await api.post<ApiResponse<Incident>>(`/incidents/${id}/close`);
    return res.data;
  },

  async cancel(id: string, reason?: string): Promise<Incident> {
    const res = await api.post<ApiResponse<Incident>>(`/incidents/${id}/cancel`, { reason });
    return res.data;
  },
};
