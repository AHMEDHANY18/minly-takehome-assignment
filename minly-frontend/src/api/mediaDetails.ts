import { api } from "./axios";

/* ---------- Types ---------- */

export type MediaComment = {
  id: string;
  text: string;
  createdAt: string;
  user: { id: string; name: string; avatarUrl: string | null };
  _count?: { replies: number };
};

export type ReplyItem = {
  id: string;
  text: string;
  createdAt: string;
  user: { id: string; name: string; avatarUrl: string | null };
};

export type MediaDetailsResponse = {
  media: {
    id: string;
    url: string;
    type: "IMAGE" | "VIDEO";
    title?: string | null;
    description?: string | null;
    createdAt: string;
    likesCount: number;
    isLiked: boolean;
    isBookmarked: boolean;
    uploader: {
      id: string;
      name: string;
      avatarUrl?: string | null;
    };
  };
  comments: MediaComment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
};

export type AddCommentBody = {
  text: string;
  parentCommentId?: string;
};

export type AddCommentResponse = {
  status: "success" | "error";
  data?: any;
};

export type RepliesResponse = {
  status: "success" | "error";
  data: ReplyItem[];
  meta?: { nextCursor: string | null; hasMore: boolean; limit: number };
};

export const MediaDetailsAPI = {
  // ✅ endpoint الجديد اللي عملته في الباك
  getDetails(mediaId: string, params?: { page?: number; limit?: number }) {
    return api.get<{ status: "success"; data: MediaDetailsResponse }>(
      `/media/${mediaId}/details`,
      { params }
    );
  },

  // ✅ نفس مسار الباك القديم (عشان متطلعش 404)
  addComment(mediaId: string, body: AddCommentBody) {
    return api.post<AddCommentResponse>(`/comment/${mediaId}/add-comment`, body);
  },

  // ✅ نفس مسار الباك القديم (لاحظ comment مش comments)
  getReplies(commentId: string, params?: { limit?: number; cursor?: string | null }) {
    return api.get<RepliesResponse>(`/comment/${commentId}/replies`, { params });
  },
};
