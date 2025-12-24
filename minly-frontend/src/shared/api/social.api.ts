import { api } from "@/shared/api/http";

export type SuggestedUser = {
  id: string;
  name: string;
  avatarUrl: string | null;
  followerCount: number;
  followingCount: number;
  mediaCount: number;
};

export type SuggestedUsersResponse = {
  status: "success";
  data: SuggestedUser[];
  meta: { excludedFollowingCount: number };
};

export const SocialAPI = {
  toggleLike(mediaId: string) {
    return api.post(`/like/${mediaId}`);
  },

  toggleBookmark(mediaId: string) {
    return api.post(`/bookmark/${mediaId}`);
  },

  suggestedUsers() {
    return api.get<SuggestedUsersResponse>("/user/suggested");
  },
  async checkFollow(userId: string): Promise<boolean> {
    const res = await api.get(`/follow/${userId}`);
    return Boolean(res.data?.data?.isFollowing ?? res.data?.isFollowing);
  },
  async toggleFollow(userId: string): Promise<boolean | undefined> {
    const res = await api.post(`/follow/${userId}`);
    return res.data?.data?.isFollowing ?? res.data?.isFollowing;
  },
  follow(userId: string) {
    return api.post(`/follow/${userId}`);
  },
};
