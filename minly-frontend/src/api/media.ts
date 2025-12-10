// src/api/media.ts
import type { AxiosResponse } from "axios";
import { api } from "./axios";

export type MediaItem = {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  type: "image" | "video" | "IMAGE" | "VIDEO";
  title: string | null;
  description: string | null;
  likesCount: number;
  createdAt: string;
  updatedAt?: string;
  isLiked?: boolean;

  uploader: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    mediaCount?: number;
    totalLikesReceived?: number;
    totalLikesGiven?: number;
    createdAt?: string;
    updatedAt?: string;
  };

  isLikedByCurrentUser?: boolean;
};

type MediaListResponse = { data?: MediaItem[]; items?: MediaItem[] };
type ToggleLikeResponse = { status?: string };

export const MediaAPI = {
  /** Global feed */
  getFeed(page: number, limit: number): Promise<AxiosResponse<MediaListResponse>> {
    return api.get<MediaListResponse>("/media", { params: { page, limit } });
  },

  /** Profile media list */
  getUserMedia(userId: string, page = 1, limit = 50): Promise<AxiosResponse<MediaListResponse>> {
    return api.get<MediaListResponse>("/media", {
      params: { page, limit, uploaderId: userId },
    });
  },

  /** Upload */
  uploadMedia(params: { file: File; title?: string; description?: string }): Promise<AxiosResponse<MediaItem>> {
    const form = new FormData();
    form.append("file", params.file);
    if (params.title) form.append("title", params.title);
    if (params.description) form.append("description", params.description);

    return api.post<MediaItem>("/media", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  /** Like toggle */
  toggleLike(mediaId: string): Promise<AxiosResponse<ToggleLikeResponse>> {
    return api.post<ToggleLikeResponse>(`/like/${mediaId}`);
  },

  deleteMedia(id: string): Promise<AxiosResponse<void>> {
    return api.delete(`/media/${id}`);
  },

  updateMedia(id: string, body: { title?: string; description?: string }): Promise<AxiosResponse<MediaItem>> {
    return api.patch<MediaItem>(`/media/${id}`, body);
  },
};
