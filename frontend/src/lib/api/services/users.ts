import { api } from "@/lib/api/client";
import type { LaravelPaginator, Mission, User, UserRole } from "@/lib/types";

export interface CreateUserPayload {
  fullname: string;
  phone: string;
  role: Exclude<UserRole, "spectator">;
  team_id?: string | null;
  zone_id?: string | null;
}

export interface UpdateUserPayload {
  fullname?: string;
  team_id?: string | null;
  zone_id?: string | null;
}

export const usersApi = {
  async list(query?: {
    role?: UserRole;
    team_id?: string;
    zone_id?: string;
    is_active?: boolean;
    page?: number;
  }): Promise<LaravelPaginator<User>> {
    return api.get<LaravelPaginator<User>>("/users", { query });
  },

  async create(payload: CreateUserPayload): Promise<{ id: string; phone: string; role: string }> {
    const res = await api.post<{ data: { id: string; phone: string; role: string } }>(
      "/users",
      payload,
    );
    return res.data;
  },

  async update(id: string, payload: UpdateUserPayload): Promise<User> {
    const res = await api.patch<{ data: User }>(`/users/${id}`, payload);
    return res.data;
  },

  async activate(id: string): Promise<{ message: string }> {
    return api.post<{ message: string }>(`/users/${id}/activate`);
  },

  async deactivate(id: string): Promise<{ message: string }> {
    return api.post<{ message: string }>(`/users/${id}/deactivate`);
  },

  async resetPassword(id: string): Promise<{ message: string }> {
    return api.post<{ message: string }>(`/users/${id}/reset-password`);
  },

  async missionsHistory(id: string, query?: { page?: number }): Promise<LaravelPaginator<Mission>> {
    return api.get<LaravelPaginator<Mission>>(`/users/${id}/missions-history`, { query });
  },
};
