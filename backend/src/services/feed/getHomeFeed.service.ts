// src/services/feed/getHomeFeed.service.ts
import { FeedRepository, FeedCursor } from "../../repositories/feed.repository";
import { FeedMediaItem } from "../../types/feed";

interface GetHomeFeedParams {
  page: number;
  limit: number;
  viewerId: string;
  cursor?: string | null;
}

export async function getHomeFeedService({
  page,
  limit,
  viewerId,
  cursor,
}: GetHomeFeedParams) {
  const skip = (page - 1) * limit;

  const followingIds = await FeedRepository.getFollowingIds(viewerId);

  let feedCursor: FeedCursor | null = null;
  if (cursor) {
    feedCursor = await FeedRepository.findCursorAnchor(cursor);
  }

  // ✅ Case 1: user is not following anyone => fallback
  if (followingIds.length === 0) {
    return getFallbackFeed({
      page,
      limit,
      viewerId,
      excludeUploaderIds: [viewerId],
      reason: "NO_FOLLOWING",
      feedCursor,
    });
  }

  const [rawItems, total] = await Promise.all([
    FeedRepository.findHomeFeedWithViewer({
      skip,
      take: limit,
      viewerId,
      followingIds,
      cursor: feedCursor,
    }),
    FeedRepository.countHomeFeed({ followingIds }),
  ]);

  // ✅ Case 2: following exists but no posts => fallback
  if (total === 0 || (rawItems.length === 0 && !feedCursor)) {
    return getFallbackFeed({
      page,
      limit,
      viewerId,
      // اختياري: استبعد نفسك + اللي بتتابعهم (عشان مايبقاش fallback نفسهم)
      excludeUploaderIds: [viewerId, ...followingIds],
      reason: "NO_POSTS_FROM_FOLLOWING",
      feedCursor,
    });
  }

  const items = mapFeedItems(rawItems);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      nextCursor: items.length === limit ? items[items.length - 1].id : null,
    },
    meta: {
      mode: "home" as const,
      followingCount: followingIds.length,
    },
  };
}

async function getFallbackFeed(params: {
  page: number;
  limit: number;
  viewerId: string;
  excludeUploaderIds: string[];
  reason: "NO_FOLLOWING" | "NO_POSTS_FROM_FOLLOWING";
  feedCursor?: FeedCursor | null;
}) {
  const { page, limit, viewerId, excludeUploaderIds, reason, feedCursor } =
    params;
  const skip = (page - 1) * limit;

  const [rawItems, total] = await Promise.all([
    FeedRepository.findFallbackFeedWithViewer({
      skip,
      take: limit,
      viewerId,
      excludeUploaderIds,
      cursor: feedCursor,
    }),
    FeedRepository.countFallbackFeed({ excludeUploaderIds }),
  ]);

  const items = mapFeedItems(rawItems);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      nextCursor: items.length === limit ? items[items.length - 1].id : null,
    },
    meta: {
      mode: "fallback" as const,
      reason,
      message:
        "Showing recommended posts. Follow users to personalize your home feed.",
    },
  };
}

function mapFeedItems(rawItems: FeedMediaItem[]) {
  return rawItems.map((item) => {
    const { likes, bookmarks, ...rest } = item;
    return {
      ...rest,
      isLiked: likes.length > 0,
      isBookmarked: bookmarks.length > 0,
    };
  });
}
