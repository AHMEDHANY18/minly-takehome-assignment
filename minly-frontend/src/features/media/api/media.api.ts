import { api } from "@/shared/api/http";

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

export type FinalizeApiResponse<T = unknown> = {
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

  finalize<T = unknown>(body: {
    kind: UploadKind;
    key: string;
    title?: string;
    description?: string;
    type?: MediaType;
  }) {
    return api.post<FinalizeApiResponse<T>>("/media/finalize", body);
  },

  update(mediaId: string, payload: { title?: string; description?: string }) {
    return api.patch<{ status: "success"; data: MediaEntity }>(
      `/media/${mediaId}`,
      payload
    );
  },

  remove(mediaId: string) {
    return api.delete<{ status: "success" }>(`/media/${mediaId}`);
  },
};
