import type { AxiosResponse } from "axios";
import { apiClient } from "./apiClient";
import type { MediaItem } from "../types/media";

type MediaListResponse = { data?: MediaItem[]; items?: MediaItem[] };
type ToggleLikeResponse = { status?: string };

export const MediaAPI = {
  getFeed(page: number, limit: number): Promise<AxiosResponse<MediaListResponse>> {
    return apiClient.get<MediaListResponse>("/media", { params: { page, limit } });
  },
  uploadMedia(form: FormData): Promise<AxiosResponse<MediaItem>> {
    return apiClient.post<MediaItem>("/media", form, {
      headers: { "Content-Type": "multipart/form-data" },
      transformRequest: (d) => d,
    });
  },
  toggleLike(mediaId: string): Promise<AxiosResponse<ToggleLikeResponse>> {
    return apiClient.post<ToggleLikeResponse>(`/like/${mediaId}`);
  },
  deleteMedia(id: string): Promise<AxiosResponse<void>> {
    return apiClient.delete(`/media/${id}`);
  },
  updateMedia(id: string, body: { title?: string | null; description?: string | null }): Promise<
    AxiosResponse<MediaItem>
  > {
    return apiClient.patch<MediaItem>(`/media/${id}`, body);
  },
};
