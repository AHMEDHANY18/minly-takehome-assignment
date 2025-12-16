import { api } from "./axios";

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

   follow(userId: string) {
    return api.post(`/follow/${userId}`);
  },
};
