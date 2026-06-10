// src/features/search/api/search.api.ts
import { api } from "@/api/client";
import type { FeedItem } from "@/features/feed/api/feed.api";

export type SearchUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  followerCount: number;
  isFollowing: boolean;
};

export type SearchPage<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

export const SearchAPI = {
  /** GET /user/search?q=&page=&limit= */
  async users(params: { q: string; page?: number; limit?: number }): Promise<SearchPage<SearchUser>> {
    const res = await api.get<{
      status: string;
      data: {
        users: SearchUser[];
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
      };
    }>("/user/search", { params });

    const d = res.data.data;
    return {
      items: d?.users ?? [],
      page: d?.page ?? params.page ?? 1,
      limit: d?.limit ?? params.limit ?? 10,
      total: d?.total ?? 0,
      hasMore: !!d?.hasMore,
    };
  },

  /** GET /media/search?q=&page=&limit= */
  async media(params: { q: string; page?: number; limit?: number }): Promise<SearchPage<FeedItem>> {
    const res = await api.get<{
      status: string;
      data: {
        items: FeedItem[];
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
      };
    }>("/media/search", { params });

    const d = res.data.data;
    return {
      items: d?.items ?? [],
      page: d?.page ?? params.page ?? 1,
      limit: d?.limit ?? params.limit ?? 10,
      total: d?.total ?? 0,
      hasMore: !!d?.hasMore,
    };
  },
};
