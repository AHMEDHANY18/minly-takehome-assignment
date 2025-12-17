// src/api/profile.ts
import { api } from "./axios";

export type ProfileMediaItem = {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  type: "IMAGE" | "VIDEO" | string;
  title: string;
  description: string;
  likesCount: number;
  commentCount: number;
  createdAt: string;
};

export type ProfileResponse = {
  status: "success";
  data: {
    user: {
      id: string;
      name: string;
      avatarUrl: string | null;
      email: string;
      mediaCount: number;
      totalLikesReceived: number;
      totalLikesGiven: number;
      followerCount: number;
      followingCount: number;
      createdAt: string;
    };
    media: ProfileMediaItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    meta: { tab: "ALL" | "VIDEOS" | "PHOTOS" | "SAVED" | string; isMe: boolean };
  };
};

export const ProfileAPI = {
  me() {
    return api.get<ProfileResponse>("/user/profile");
  },
};
