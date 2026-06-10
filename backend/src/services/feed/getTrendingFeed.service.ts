import { FeedRepository, FeedCursor } from "../../repositories/feed.repository";
import { FeedMediaItem } from "../../types/feed";
import { cacheGet, cacheSet } from "../../config/redis";

interface GetTrendingFeedParams {
  page: number;
  limit: number;
  windowHours: number;
  viewerId: string;
  cursor?: string | null;
}

const TRENDING_CACHE_TTL_SECONDS = 60;

export async function getTrendingFeedService({
  page,
  limit,
  windowHours,
  viewerId,
  cursor,
}: GetTrendingFeedParams) {
  const skip = (page - 1) * limit;

  // page-1 cache (Redis is optional — cacheGet/cacheSet never throw)
  const cacheKey = `feed:trending:p1:l${limit}`;
  const cacheable = page === 1 && !cursor;

  if (cacheable) {
    const cached = await cacheGet(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // corrupt cache entry — fall through and recompute
      }
    }
  }

  let feedCursor: FeedCursor | null = null;
  if (cursor) {
    feedCursor = await FeedRepository.findCursorAnchor(cursor);
  }

  const [rawItems, total] = await Promise.all([
    FeedRepository.findTrendingFeedWithViewer({
      skip,
      take: limit,
      windowHours,
      viewerId,
      cursor: feedCursor,
    }),
    FeedRepository.countTrendingFeed({ windowHours }),
  ]);

  const items = rawItems.map((item: FeedMediaItem) => {
    const { likes, bookmarks, ...rest } = item;

    return {
      ...rest,
      isLiked: likes.length > 0,
      isBookmarked: bookmarks.length > 0,
    };
  });

  const result = {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      nextCursor: items.length === limit ? items[items.length - 1].id : null,
    },
  };

  if (cacheable) {
    await cacheSet(cacheKey, JSON.stringify(result), TRENDING_CACHE_TTL_SECONDS);
  }

  return result;
}
