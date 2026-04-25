import { api } from "@/lib/api/client";
import {
  setQrSessionToken,
  setTrackingToken,
} from "@/lib/auth/tokens";
import type {
  Alerte,
  AlerteCategory,
  QrScanResponse,
  SubCategory,
} from "@/lib/types";

export interface QrAlertePayload {
  category: AlerteCategory;
  sub_category?: SubCategory | null;
  description?: string | null;
  photo_media_id?: string | null;
  audio_media_id?: string | null;
}

export interface QrAttachPhonePayload {
  phone: string;
}

interface QrAlerteResponse {
  data: {
    alerte: Pick<Alerte, "id" | "reference" | "status" | "is_potential_duplicate">;
  };
}

export const qrApi = {
  /** F1.2 — valide le token QR et ouvre une session de 15 min. */
  async scan(token: string): Promise<QrScanResponse> {
    const res = await api.post<{ data: QrScanResponse }>(
      "/qr/scan",
      { token },
      { auth: "none" },
    );
    setQrSessionToken(res.data.scan_session_token);
    return res.data;
  },

  /** F1.4 — soumission de l'alerte. La session QR est lue depuis sessionStorage. */
  async submitAlerte(payload: QrAlertePayload): Promise<QrAlerteResponse["data"]["alerte"]> {
    const res = await api.post<QrAlerteResponse>("/qr/alertes", payload, {
      auth: "qr-session",
    });
    return res.data.alerte;
  },

  /** F1.5 — attache un numéro à l'alerte → SMS OTP envoyé. */
  async attachPhone(alerteId: string, payload: QrAttachPhonePayload): Promise<{ message: string }> {
    return api.post<{ message: string }>(
      `/qr/alertes/${alerteId}/attach-phone`,
      payload,
      { auth: "qr-session" },
    );
  },

  /** F1.6 — demande d'OTP pour consulter l'historique. */
  async requestTrackingOtp(phone: string): Promise<{ message: string }> {
    return api.post<{ message: string }>(
      "/qr/tracking/request-otp",
      { phone },
      { auth: "none" },
    );
  },

  /** F1.6 — vérifie l'OTP et stocke le tracking token. */
  async verifyTrackingOtp(payload: { phone: string; otp: string }): Promise<{ tracking_token: string; expires_in: number }> {
    const res = await api.post<{ data: { tracking_token: string; expires_in: number } }>(
      "/qr/tracking/verify-otp",
      payload,
      { auth: "none" },
    );
    setTrackingToken(res.data.tracking_token);
    return res.data;
  },

  /** F1.6 — historique pour le tracking token courant. */
  async listTrackedAlertes(): Promise<
    Array<Pick<Alerte, "id" | "reference" | "category" | "status" | "created_at">>
  > {
    const res = await api.get<{
      data: Array<Pick<Alerte, "id" | "reference" | "category" | "status" | "created_at">>;
    }>("/qr/tracking/alertes", { auth: "tracking" });
    return res.data;
  },
};
