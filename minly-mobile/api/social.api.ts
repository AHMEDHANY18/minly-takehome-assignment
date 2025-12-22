import { api } from "./apiClient";

export type SuggestedUser = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  followersCount?: number;
  isFollowing?: boolean;
};

export const SocialAPI = {
  async suggested(limit = 10) {
    const res = await api.get("/user/suggested", { params: { limit } });
    const payload: any = res.data?.data ?? res.data ?? {};
    const items: any[] = payload.items ?? payload.users ?? payload ?? [];

    return items.map((u) => ({
      id: String(u.id ?? u.userId),
      name: String(u.name ?? u.username ?? "User"),
      avatarUrl: u.avatarUrl ?? u.avatar ?? null,
      followersCount: Number(u.followersCount ?? 0),
      isFollowing: Boolean(u.isFollowing ?? false),
    })) as SuggestedUser[];
  },

  async follow(userId: string) {
    // عدّل المسار لو عندك مختلف
    await api.post(`/social/follow/${userId}`);
  },

  async unfollow(userId: string) {
    // عدّل المسار لو عندك مختلف
    await api.delete(`/social/follow/${userId}`);
  },
};
