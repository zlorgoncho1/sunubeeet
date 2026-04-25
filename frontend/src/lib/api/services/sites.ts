import { api } from "@/lib/api/client";
import type { LaravelPaginator, Site, SiteType } from "@/lib/types";

export interface NearbyQuery {
  lat: number;
  lng: number;
  radius?: number;
  type?: SiteType | string;
}

export interface CreateSitePayload {
  name: string;
  type: SiteType;
  latitude: number;
  longitude: number;
  address?: string | null;
  phone?: string | null;
  description?: string | null;
  is_24_7?: boolean;
  opening_hours?: Record<string, unknown> | null;
  zone_id?: string | null;
}

export const sitesApi = {
  /** F2.3 — postes de secours / sites événement à proximité. */
  async nearby(query: NearbyQuery): Promise<Site[]> {
    const res = await api.get<{ data: Site[] }>("/sites/nearby", { query: query as unknown as Record<string, string | number | boolean | null | undefined> });
    return res.data;
  },

  /** F2.4 — fiche détaillée. */
  async show(id: string): Promise<Site> {
    const res = await api.get<{ data: Site }>(`/sites/${id}`);
    return res.data;
  },

  /** Liste paginée (coordinateur). */
  async list(query?: { type?: string; is_active?: boolean; page?: number }): Promise<LaravelPaginator<Site>> {
    return api.get<LaravelPaginator<Site>>("/sites", { query });
  },

  async create(payload: CreateSitePayload): Promise<Site> {
    const res = await api.post<{ data: Site }>("/sites", payload);
    return res.data;
  },

  async update(id: string, payload: Partial<CreateSitePayload>): Promise<Site> {
    const res = await api.patch<{ data: Site }>(`/sites/${id}`, payload);
    return res.data;
  },

  async destroy(id: string): Promise<{ message: string }> {
    return api.delete<{ message: string }>(`/sites/${id}`);
  },
};
