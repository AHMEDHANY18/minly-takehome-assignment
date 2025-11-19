// src/api/user.ts
import { api } from "./axios";
import type { MediaItem } from "./media";

export type MeData = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  mediaCount: number;
  totalLikesReceived: number;
  totalLikesGiven: number;
  createdAt: string;
  media: MediaItem[];
};

export const UserAPI = {
  // بنستخدم بس /user/me زي ما قلت
  getMe() {
    return api.get<{ status: string; data: MeData }>("/user/me");
  },
};
