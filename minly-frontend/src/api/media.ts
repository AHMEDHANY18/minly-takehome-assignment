// src/api/media.ts
import { api } from "./axios";

export type MediaType = "IMAGE" | "VIDEO";

export type PresignMediaResponse = {
  key: string;
  uploadUrl: string;
  publicUrl: string;
};

export type PresignMediaApiResponse = {
  status: "success";
  data: PresignMediaResponse;
};

export type FinalizeMediaApiResponse<T = any> = {
  status: "success";
  data: T;
};

export const MediaAPI = {
  // ✅ Update these routes if your router path differs
  presign(body: { contentType: string; type: MediaType }) {
    return api.post<PresignMediaApiResponse>("/media/presign", body);
  },

  finalize(body: {
    key: string;
    title?: string;
    description?: string;
    type: MediaType;
  }) {
    return api.post<FinalizeMediaApiResponse>("/media/finalize", body);
  },
};
