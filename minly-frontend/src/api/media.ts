// src/api/media.ts
import { api } from "./axios";

export type MediaType = "IMAGE" | "VIDEO";
export type UploadKind = "media" | "avatar";

export type PresignMediaResponse = {
  key: string;
  uploadUrl: string;
  publicUrl: string;
};

export type PresignMediaApiResponse = {
  status: "success";
  data: PresignMediaResponse;
};

export type FinalizeApiResponse<T = any> = {
  status: "success";
  kind: UploadKind;
  data: T;
};

export type MediaEntity = {
  id: string;
  title?: string | null;
  description?: string | null;
  updatedAt?: string;
};

export const MediaAPI = {
  presign(body: { kind: UploadKind; contentType: string; type?: MediaType }) {
    return api.post<PresignMediaApiResponse>("/media/presign", body);
  },

  finalize(body: {
    kind: UploadKind;
    key: string;
    title?: string;
    description?: string;
    type?: MediaType;
  }) {
    return api.post<FinalizeApiResponse>("/media/finalize", body);
  },

  update(mediaId: string, payload: { title?: string; description?: string }) {
    return api.patch<{ status: "success"; data: MediaEntity }>(`/media/${mediaId}`, payload);
  },

  // ✅ NEW: delete media
  remove(mediaId: string) {
    return api.delete<{ status: "success" }>(`/media/${mediaId}`);
  },
};
