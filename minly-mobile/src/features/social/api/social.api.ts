// src/features/feed/api/social.api.ts
import { api } from "@/api/client";

export type SuggestedUser = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  followersCount?: number;
  isFollowing?: boolean;
};

/** Helpers to normalize backend payloads safely */
function getPayload(res: any) {
  return res?.data?.data ?? res?.data ?? {};
}

function pickArray(payload: any): any[] {
  const v = payload?.items ?? payload?.users ?? payload;
  return Array.isArray(v) ? v : [];
}

function pickIsFollowing(payload: any): boolean | undefined {
  const v =
    payload?.isFollowing ??
    payload?.data?.isFollowing ??
    payload?.following ??
    payload?.isFollowingUser;
  return typeof v === "boolean" ? v : undefined;
}

export const SocialAPI = {
  async suggested(limit = 10): Promise<SuggestedUser[]> {
    const res = await api.get("/user/suggested", { params: { limit } });
    const payload = getPayload(res);
    const items = pickArray(payload);

    return items.map((u) => ({
      id: String(u.id ?? u.userId ?? ""),
      name: String(u.name ?? u.username ?? "User"),
      avatarUrl: u.avatarUrl ?? u.avatar ?? null,
      followersCount: Number(u.followersCount ?? 0),
      isFollowing: Boolean(u.isFollowing ?? false),
    }));
  },

  /** ✅ GET /follow/:userId => checkFollow */
  async checkFollow(userId: string): Promise<boolean> {
    const res = await api.get(`/follow/${userId}`);
    const payload = getPayload(res);

    const v = pickIsFollowing(payload);
    return Boolean(v);
  },

  /** ✅ POST /follow/:userId => toggleFollow (your backend is toggle) */
  async toggleFollow(userId: string): Promise<boolean | undefined> {
    const res = await api.post(`/follow/${userId}`);
    const payload = getPayload(res);

    return pickIsFollowing(payload);
  },

  /**
   * Legacy alias (some screens might call follow()).
   * Since your endpoint is toggle, this actually toggles.
   */
  async follow(userId: string): Promise<boolean | undefined> {
    return this.toggleFollow(userId);
  },
};
