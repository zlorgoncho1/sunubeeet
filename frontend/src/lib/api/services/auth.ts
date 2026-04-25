import { api } from "@/lib/api/client";
import {
  clearAuth,
  setAuthTokens,
} from "@/lib/auth/tokens";
import type { LoginResponse } from "@/lib/types";

export interface LoginPayload {
  phone: string;
  password: string;
}

export interface RegisterSpectatorPayload {
  fullname: string;
  phone: string;
  password: string;
}

export interface VerifyPhonePayload {
  phone: string;
  otp: string;
}

export interface ResetPasswordPayload {
  phone: string;
  otp: string;
  password: string;
  password_confirmation: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  password: string;
  password_confirmation: string;
}

interface LoginEnvelope {
  data: LoginResponse;
}

export const authApi = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const res = await api.post<LoginEnvelope>("/auth/login", payload, { auth: "none" });
    setAuthTokens(
      {
        access_token: res.data.access_token,
        token_type: res.data.token_type,
        expires_in: res.data.expires_in,
      },
      res.data.user,
      res.data.must_change_password,
    );
    return res.data;
  },

  async registerSpectator(payload: RegisterSpectatorPayload): Promise<{ user_id: string; message: string }> {
    const res = await api.post<{ data: { user_id: string }; message: string }>(
      "/auth/spectator/register",
      payload,
      { auth: "none" },
    );
    return { user_id: res.data.user_id, message: res.message };
  },

  async verifyPhone(payload: VerifyPhonePayload): Promise<{ message: string }> {
    return api.post<{ message: string }>(
      "/auth/spectator/verify-phone",
      payload,
      { auth: "none" },
    );
  },

  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout");
    } finally {
      clearAuth();
    }
  },

  async forgotPassword(phone: string): Promise<{ message: string }> {
    return api.post<{ message: string }>("/auth/password/forgot", { phone }, { auth: "none" });
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<{ message: string }> {
    return api.post<{ message: string }>("/auth/password/reset", payload, { auth: "none" });
  },

  async changePassword(payload: ChangePasswordPayload): Promise<{ message: string }> {
    return api.post<{ message: string }>("/auth/password/change", payload);
  },
};
