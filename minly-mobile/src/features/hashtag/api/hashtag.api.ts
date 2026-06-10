// src/features/hashtag/api/hashtag.api.ts
import { api } from "@/api/client";
import type { FeedItem } from "@/features/feed/api/feed.api";

/**
 * GET /media/hashtag/:tag?page=&limit=
 * Same shape as the explore feed (data: FeedItem[] + pagination),
 * but stays tolerant if the payload nests items instead.
 */
export const HashtagAPI = {
  async list(tag: string, params?: { page?: number; limit?: number }) {
    const res = await api.get<any>(
      `/media/hashtag/${encodeURIComponent(tag)}`,
      { params }
    );

    const body = res.data ?? {};
    const payload = body.data;

    const items: FeedItem[] = Array.isArray(payload)
      ? payload
      : payload?.items ?? [];

    const pagination = body.pagination ?? payload?.pagination ?? null;

    let hasMore = false;
    if (pagination) {
      if (typeof pagination.hasMore === "boolean") hasMore = pagination.hasMore;
      else if (pagination.totalPages != null)
        hasMore = Number(pagination.page) < Number(pagination.totalPages);
    } else {
      hasMore = items.length >= (params?.limit ?? 10);
    }

    return { items, hasMore };
  },
};
