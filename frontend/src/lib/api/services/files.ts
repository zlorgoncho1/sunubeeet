import { api } from "@/lib/api/client";
import type { MediaFile, MediaKind } from "@/lib/types";

export interface UploadUrlPayload {
  kind: Exclude<MediaKind, "document">;
  mime_type: string;
  size_bytes: number;
}

export interface UploadUrlResponse {
  media_id: string;
  upload_url: string;
  object_key: string;
  expires_in: number;
}

export interface FinalizePayload {
  checksum_sha256: string;
  duration_seconds?: number;
}

async function sha256Hex(blob: Blob): Promise<string> {
  if (typeof window === "undefined" || !crypto?.subtle) {
    throw new Error("Web Crypto API indisponible — checksum impossible");
  }
  const buf = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const filesApi = {
  async requestUploadUrl(payload: UploadUrlPayload): Promise<UploadUrlResponse> {
    const res = await api.post<{ data: UploadUrlResponse }>("/files/upload-url", payload);
    return res.data;
  },

  async finalize(mediaId: string, payload: FinalizePayload): Promise<{ media_id: string; status: string }> {
    const res = await api.post<{ data: { media_id: string; status: string } }>(
      `/files/${mediaId}/finalize`,
      payload,
    );
    return res.data;
  },

  async signedUrl(mediaId: string): Promise<{ url: string; expires_in: number }> {
    const res = await api.get<{ data: { url: string; expires_in: number } }>(
      `/files/${mediaId}/url`,
    );
    return res.data;
  },

  /**
   * Helper E2E : demande URL signée → PUT direct vers S3/MinIO → calcule le SHA-256
   * → finalise. Retourne le `media_id` finalisé.
   */
  async uploadFile(
    file: File | Blob,
    kind: UploadUrlPayload["kind"],
    durationSeconds?: number,
  ): Promise<{ media_id: string }> {
    const blob = file instanceof File ? file : new Blob([file]);
    const fileName = file instanceof File ? file.name : "blob";
    const mime = (file instanceof File ? file.type : (file as Blob).type) || "application/octet-stream";

    const { media_id, upload_url } = await filesApi.requestUploadUrl({
      kind,
      mime_type: mime,
      size_bytes: blob.size,
    });

    const putRes = await fetch(upload_url, {
      method: "PUT",
      headers: { "Content-Type": mime },
      body: blob,
    });
    if (!putRes.ok) {
      throw {
        status: putRes.status,
        message: `Upload échoué pour ${fileName} (${putRes.status})`,
      };
    }

    const checksum = await sha256Hex(blob);
    await filesApi.finalize(media_id, {
      checksum_sha256: checksum,
      duration_seconds: durationSeconds,
    });

    return { media_id };
  },
};
