import { api } from "@/api/client";

export type FeedMode = "home" | "explore" | "trending";

export type FeedItem = {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  type: "IMAGE" | "VIDEO";
  title: string | null;
  description: string | null;

  uploaderId: string;
  createdAt: string;

  likesCount: number;
  commentCount: number;
  viewsCount?: number;

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

export type FeedMeta = {
  mode: FeedMode;
  followingCount?: number;
};

export type FeedListResponse = {
  status: "success";
  data: FeedItem[];
  pagination: FeedPagination;
  meta: FeedMeta;
};

function endpointByMode(mode: FeedMode) {
  if (mode === "home") return "/feed/home";
  if (mode === "explore") return "/feed/explore";
  return "/feed/trending";
}

export const FeedAPI = {
  async list(params: { mode: FeedMode; page: number; limit: number }) {
    const { mode, page, limit } = params;

    const res = await api.get<FeedListResponse>(endpointByMode(mode), {
      params: { page, limit },
    });

    const payload = res.data;

    return {
      items: payload.data ?? [],
      pagination: payload.pagination,
      meta: payload.meta,
    };
  },
};
