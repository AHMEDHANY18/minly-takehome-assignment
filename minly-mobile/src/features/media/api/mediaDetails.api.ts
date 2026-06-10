import { api } from "@/api/client";


export type MediaComment = {
  id: string;
  text: string;
  createdAt: string;
  isEdited?: boolean;
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
    viewsCount?: number;
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
  message?: string;
};

export type RepliesResponse = {
  status: "success" | "error";
  data: ReplyItem[];
  meta?: { nextCursor: string | null; hasMore: boolean; limit: number };
};

export const MediaDetailsAPI = {
  // ✅ GET /media/:id/details
  getDetails(mediaId: string, params?: { page?: number; limit?: number }) {
    return api.get<{ status: "success"; data: MediaDetailsResponse }>(
      `/media/${mediaId}/details`,
      { params }
    );
  },

  // ✅ POST /comment/:mediaId/add-comment (legacy)
  addComment(mediaId: string, body: AddCommentBody) {
    return api.post<AddCommentResponse>(`/comment/${mediaId}/add-comment`, body);
  },

  // ✅ GET /comment/:commentId/replies
  getReplies(commentId: string, params?: { limit?: number; cursor?: string | null }) {
    return api.get<RepliesResponse>(`/comment/${commentId}/replies`, { params });
  },

  // ✅ PATCH /comment/:commentId (owner only)
  editComment(commentId: string, text: string) {
    return api.patch<{
      status: "success";
      data: { id: string; text: string; isEdited: boolean; updatedAt: string };
    }>(`/comment/${commentId}`, { text });
  },
};
