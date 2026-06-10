import { FeedRepository } from "../../repositories/feed.repository";
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
const TRENDING_WINDOW_HOURS = 7 * 24; // 7-day window
const TRENDING_CANDIDATE_CAP = 300;

function trendingScore(item: {
  viewsCount: number;
  likesCount: number;
  commentCount: number;
  createdAt: Date;
}) {
  const ageInHours =
    (Date.now() - new Date(item.createdAt).getTime()) / (60 * 60 * 1000);

  return (
    (item.viewsCount + item.likesCount * 3 + item.commentCount * 5) /
    Math.pow(ageInHours + 2, 1.5)
  );
}

export async function getTrendingFeedService({
  page,
  limit,
  viewerId,
  cursor,
}: GetTrendingFeedParams) {
  // page-1 cache (Redis is optional — cacheGet/cacheSet never throw)
  const cacheKey = `feed:trending:v2:p1:l${limit}`;
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

  const candidates = await FeedRepository.findTrendingCandidates({
    viewerId,
    windowHours: TRENDING_WINDOW_HOURS,
    cap: TRENDING_CANDIDATE_CAP,
  });

  // graceful fallback: nothing in the window → recent-first
  if (candidates.length === 0) {
    const skip = (page - 1) * limit;
    const [rawItems, total] = await Promise.all([
      FeedRepository.findRecentFeedWithViewer({ skip, take: limit, viewerId }),
      FeedRepository.countAllMedia(),
    ]);

    const items = rawItems.map((item: FeedMediaItem) => {
      const { likes, bookmarks, ...rest } = item;
      return {
        ...rest,
        isLiked: likes.length > 0,
        isBookmarked: bookmarks.length > 0,
      };
    });

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        nextCursor: items.length === limit ? items[items.length - 1].id : null,
      },
    };
  }

  // score + sort in memory
  const scored = candidates
    .map((item: FeedMediaItem) => ({ item, score: trendingScore(item) }))
    .sort((a, b) => b.score - a.score)
    .map((s) => s.item);

  // paginate in memory (cursor takes precedence over page)
  let start = (page - 1) * limit;
  if (cursor) {
    const idx = scored.findIndex((item) => item.id === cursor);
    start = idx >= 0 ? idx + 1 : 0;
  }

  const pageItems = scored.slice(start, start + limit);

  const items = pageItems.map((item: FeedMediaItem) => {
    const { likes, bookmarks, ...rest } = item;
    return {
      ...rest,
      isLiked: likes.length > 0,
      isBookmarked: bookmarks.length > 0,
    };
  });

  const total = scored.length;

  const result = {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      nextCursor:
        items.length === limit && start + limit < total
          ? items[items.length - 1].id
          : null,
    },
  };

  if (cacheable) {
    await cacheSet(cacheKey, JSON.stringify(result), TRENDING_CACHE_TTL_SECONDS);
  }

  return result;
}
