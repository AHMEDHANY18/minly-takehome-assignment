import { api } from "@/shared/api/http";
import type { FeedItem } from "@/features/feed/api/feed.api";

export type SearchUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  followerCount: number;
  isFollowing: boolean;
};

export type SearchUsersData = {
  users: SearchUser[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

export type SearchMediaData = {
  items: FeedItem[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

type Envelope<T> = { status: "success"; data: T };

export const SearchAPI = {
  users(q: string, page = 1, limit = 10) {
    return api.get<Envelope<SearchUsersData>>("/user/search", {
      params: { q, page, limit },
    });
  },

  media(q: string, page = 1, limit = 12) {
    return api.get<Envelope<SearchMediaData>>("/media/search", {
      params: { q, page, limit },
    });
  },
};
