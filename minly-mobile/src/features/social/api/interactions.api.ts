import { api } from "@/api/client";

export type ToggleLikeResponse = {
  status: "success";
  data: { liked: boolean };
};

export type ToggleBookmarkResponse = {
  status: "success";
  data: { bookmarked: boolean };
};

export const InteractionsAPI = {
  async toggleLike(mediaId: string) {
    // endpoint: /like/:id  (toggle)
    const res = await api.post<ToggleLikeResponse>(`/like/${mediaId}`);
    return res.data?.data?.liked; // ممكن تكون undefined لو الباك مش بيرجع liked
  },

  async toggleBookmark(mediaId: string) {
    // endpoint: /bookmark/:id (toggle)
    const res = await api.post<ToggleBookmarkResponse>(`/bookmark/${mediaId}`);
    return res.data?.data?.bookmarked; // عندك مؤكدة
  },
};
