import { api } from "@/shared/api/http";
import type { FeedItem } from "@/features/feed/api/feed.api";

/**
 * GET /v1/media/hashtag/:tag — same shape as the explore feed.
 * Tolerates both `data: FeedItem[]` (explore shape) and `data: { items }`.
 */
type HashtagFeedBody = {
  status: "success";
  data: FeedItem[] | { items: FeedItem[]; hasMore?: boolean };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
    hasMore?: boolean;
    hasNext?: boolean;
  } | null;
};

export type HashtagPageResult = {
  items: FeedItem[];
  hasMore: boolean;
};

export const HashtagAPI = {
  async media(tag: string, page = 1, limit = 12): Promise<HashtagPageResult> {
    const res = await api.get<HashtagFeedBody>(
      `/media/hashtag/${encodeURIComponent(tag)}`,
      { params: { page, limit } }
    );

    const body = res.data;
    const raw = body.data;
    const items = Array.isArray(raw) ? raw : raw?.items ?? [];

    const pag = body.pagination;
    let hasMore = false;
    if (!Array.isArray(raw) && typeof raw?.hasMore === "boolean") {
      hasMore = raw.hasMore;
    } else if (pag) {
      if (typeof pag.hasMore === "boolean") hasMore = pag.hasMore;
      else if (typeof pag.hasNext === "boolean") hasMore = pag.hasNext;
      else if (typeof pag.totalPages === "number")
        hasMore = pag.page < pag.totalPages;
    }

    return { items, hasMore };
  },
};
