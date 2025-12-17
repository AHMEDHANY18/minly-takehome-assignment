import { api } from "./axios";

export type MediaComment = {
  id: string;
  text: string;
  createdAt: string;
  user: { id: string; name: string; avatarUrl: string | null };
  _count?: { replies: number };
};

export type MediaCommentsResponse = {
  status: "success" | "error";
  data: MediaComment[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export type ReplyItem = {
  id: string;
  text: string;
  createdAt: string;
  user: { id: string; name: string; avatarUrl: string | null };
};

export type RepliesResponse = {
  status: "success" | "error";
  data: ReplyItem[];
  meta: { nextCursor: string | null; hasMore: boolean; limit: number };
};

export type AddCommentBody = {
    text: string;
    parentCommentId?: string; // optional => لو موجود يبقى reply
  };

  export type AddCommentResponse = {
    status: "success" | "error";
    data?: any; // لو الباك بيرجع الكومنت الجديد هنستفيد منه
  };


export const MediaDetailsAPI = {
  // ✅ حسب اللي عندك: GET /media/:mediaId -> returns comments
  getComments(mediaId: string, params?: { page?: number; limit?: number }) {
    return api.get<MediaCommentsResponse>(`/media/${mediaId}`, { params });
  },

  // ✅ GET /comment/:commentId/replies
  getReplies(commentId: string, params?: { limit?: number; cursor?: string | null }) {
    return api.get<RepliesResponse>(`/comment/${commentId}/replies`, { params });
  },

  addComment(mediaId: string, body: AddCommentBody) {
    return api.post<AddCommentResponse>(`/comment/${mediaId}/add-comment`, body);
  },


};
