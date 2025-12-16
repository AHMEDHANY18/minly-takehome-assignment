import { api } from "./axios";

export type MediaType = "IMAGE" | "VIDEO";
export type FeedMode = "home" | "explore" | "trending";

export type FeedItem = {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  type: MediaType;
  title: string | null;
  description: string | null;
  uploaderId: string;
  likesCount: number;
  commentCount: number;
  createdAt: string;
  uploader: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  isLiked: boolean;
  isBookmarked: boolean;
};

export type FeedPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type FeedResponse = {
  status: "success";
  data: FeedItem[];
  pagination: FeedPagination;
  meta: any;
};

export const FeedAPI = {
  list(mode: FeedMode, page = 1, limit = 20) {
    return api.get<FeedResponse>(`/feed/${mode}`, {
      params: { page, limit },
    });
  },
};
