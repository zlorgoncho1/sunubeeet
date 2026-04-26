import { api } from "@/lib/api/client";
import type { LaravelPaginator, QRCode, Zone } from "@/lib/types";

export interface CreateQrCodePayload {
  location_label: string;
  latitude: number;
  longitude: number;
  zone_id?: string | null;
  site_id?: string | null;
  description?: string | null;
}

export interface BatchQrCodeItem {
  location_label: string;
  latitude: number;
  longitude: number;
  zone_id?: string | null;
}

export interface CreateZonePayload {
  name: string;
  parent_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
}

export const adminApi = {
  qrCodes: {
    async list(query?: { zone_id?: string; is_active?: boolean; page?: number }): Promise<LaravelPaginator<QRCode>> {
      return api.get<LaravelPaginator<QRCode>>("/qr-codes", { query });
    },
    async create(payload: CreateQrCodePayload): Promise<{ id: string; token: string; scan_url: string; qr: QRCode }> {
      const res = await api.post<{ data: { id: string; token: string; scan_url: string; qr: QRCode } }>(
        "/qr-codes",
        payload,
      );
      return res.data;
    },
    async batch(items: BatchQrCodeItem[]): Promise<{ id: string; token: string; label: string }[]> {
      const res = await api.post<{ data: { id: string; token: string; label: string }[] }>(
        "/qr-codes/batch",
        { items },
      );
      return res.data;
    },
    async update(id: string, payload: Partial<CreateQrCodePayload>): Promise<QRCode> {
      const res = await api.patch<{ data: QRCode }>(`/qr-codes/${id}`, payload);
      return res.data;
    },
    async rotate(id: string): Promise<{ token: string; scan_url: string }> {
      const res = await api.post<{ data: { token: string; scan_url: string }; message: string }>(
        `/qr-codes/${id}/rotate`,
      );
      return res.data;
    },
    async deactivate(id: string): Promise<{ message: string }> {
      return api.post<{ message: string }>(`/qr-codes/${id}/deactivate`);
    },
  },

  zones: {
    async list(): Promise<Zone[]> {
      const res = await api.get<{ data: Zone[] }>("/zones");
      return res.data;
    },
    async create(payload: CreateZonePayload): Promise<Zone> {
      const res = await api.post<{ data: Zone }>("/zones", payload);
      return res.data;
    },
    async update(id: string, payload: Partial<CreateZonePayload> & { is_active?: boolean }): Promise<Zone> {
      const res = await api.patch<{ data: Zone }>(`/zones/${id}`, payload);
      return res.data;
    },
  },

  async auditLogs(query?: { page?: number; action?: string }): Promise<LaravelPaginator<unknown>> {
    return api.get<LaravelPaginator<unknown>>("/audit-logs", { query });
  },
};
