// src/services/feed/getHomeFeed.service.ts
import { FeedRepository } from "../../repositories/feed.repository";
import { FeedMediaItem } from "../../types/feed";

interface GetHomeFeedParams {
  page: number;
  limit: number;
  viewerId: string;
}

export async function getHomeFeedService({
  page,
  limit,
  viewerId,
}: GetHomeFeedParams) {
  const skip = (page - 1) * limit;

  const followingIds = await FeedRepository.getFollowingIds(viewerId);

  // ✅ Case 1: user is not following anyone => fallback
  if (followingIds.length === 0) {
    return getFallbackFeed({
      page,
      limit,
      viewerId,
      excludeUploaderIds: [viewerId],
      reason: "NO_FOLLOWING",
    });
  }

  const [rawItems, total] = await Promise.all([
    FeedRepository.findHomeFeedWithViewer({
      skip,
      take: limit,
      viewerId,
      followingIds,
    }),
    FeedRepository.countHomeFeed({ followingIds }),
  ]);

  // ✅ Case 2: following exists but no posts => fallback
  if (total === 0 || rawItems.length === 0) {
    return getFallbackFeed({
      page,
      limit,
      viewerId,
      // اختياري: استبعد نفسك + اللي بتتابعهم (عشان مايبقاش fallback نفسهم)
      excludeUploaderIds: [viewerId, ...followingIds],
      reason: "NO_POSTS_FROM_FOLLOWING",
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
}) {
  const { page, limit, viewerId, excludeUploaderIds, reason } = params;
  const skip = (page - 1) * limit;

  const [rawItems, total] = await Promise.all([
    FeedRepository.findFallbackFeedWithViewer({
      skip,
      take: limit,
      viewerId,
      excludeUploaderIds,
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
