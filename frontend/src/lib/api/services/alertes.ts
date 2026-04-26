import { api } from "@/lib/api/client";
import type {
  Alerte,
  AlerteCategory,
  LaravelPaginator,
  SubCategory,
} from "@/lib/types";

export interface CreateAlertePayload {
  category: AlerteCategory;
  sub_category?: SubCategory | null;
  description?: string | null;
  latitude: number;
  longitude: number;
  zone_id?: string | null;
  photo_media_id?: string | null;
  audio_media_id?: string | null;
}

export interface CreateAlerteResponse {
  id: string;
  reference: string;
  status: string;
  is_potential_duplicate: boolean;
}

export interface TimelineEvent {
  action: string;
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  created_at: string;
}

export interface TimelineResponse {
  alerte: Pick<Alerte, "id" | "reference" | "category" | "status">;
  timeline: TimelineEvent[];
}

export const alertesApi = {
  /** F2.6 — création d'alerte par un spectateur connecté. */
  async create(payload: CreateAlertePayload): Promise<CreateAlerteResponse> {
    const res = await api.post<{ data: CreateAlerteResponse }>("/alertes", payload);
    return res.data;
  },

  /** F2.8 — historique de l'utilisateur connecté (paginé). */
  async listMine(query?: { page?: number }): Promise<LaravelPaginator<Alerte>> {
    return api.get<LaravelPaginator<Alerte>>("/me/alertes", { query });
  },

  /** F2.7 — timeline d'une alerte. */
  async timeline(alerteId: string): Promise<TimelineResponse> {
    const res = await api.get<{ data: TimelineResponse }>(
      `/me/alertes/${alerteId}/timeline`,
    );
    return res.data;
  },
};
