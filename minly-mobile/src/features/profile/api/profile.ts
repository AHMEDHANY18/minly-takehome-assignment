// src/features/profile/api/profile.ts
import { api } from "@/api/client";

export type ProfileTab = "ALL" | "VIDEOS" | "PHOTOS" | "SAVED";

/** الباك بيستقبل type = ALL | IMAGE | VIDEO */
export type BackendProfileType = "ALL" | "IMAGE" | "VIDEO";

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
  updatedAt: string;
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
    meta: { tab: string; isMe: boolean };
  };
};

function tabToBackendType(tab: ProfileTab): BackendProfileType {
  if (tab === "PHOTOS") return "IMAGE";
  if (tab === "VIDEOS") return "VIDEO";
  return "ALL";
}

export const ProfileAPI = {
  /**
   * ✅ GET /user/profile (me)
   * ✅ GET /user/profile/:userId (user)
   * Query: page, limit, type
   */
  get(params?: { userId?: string; page?: number; limit?: number; tab?: ProfileTab }) {
    const sp = new URLSearchParams();

    if (params?.page) sp.set("page", String(params.page));
    if (params?.limit) sp.set("limit", String(params.limit));

    // ✅ backend expects "type"
    if (params?.tab && params.tab !== "SAVED") {
      sp.set("type", tabToBackendType(params.tab));
    } else {
      // default
      sp.set("type", "ALL");
    }

    const qs = sp.toString();

    // ✅ لو userId موجود استخدم /profile/:userId
    const path = params?.userId
      ? `/user/profile/${encodeURIComponent(params.userId)}`
      : `/user/profile`;

    return api.get<ProfileResponse>(`${path}${qs ? `?${qs}` : ""}`);
  },

  /** update name (no file) */
  update(body: { name?: string }) {
    return api.patch<{ status: "success"; data: any }>("/user", body);
  },
};
