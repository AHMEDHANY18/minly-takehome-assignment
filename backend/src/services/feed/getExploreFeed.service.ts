import { FeedRepository } from "../../repositories/feed.repository";
import { FeedMediaItem } from "../../types/feed";

interface GetExploreFeedParams {
  page: number;
  limit: number;
  viewerId: string;
}

export async function getExploreFeedService({
  page,
  limit,
  viewerId,
}: GetExploreFeedParams) {
  const skip = (page - 1) * limit;

  // استبعد نفسك + اللي بتتابعهم
  const followingIds = await FeedRepository.getFollowingIds(viewerId);
  const excludeUploaderIds = [viewerId, ...followingIds];

  const [rawItems, total] =
  await FeedRepository.findExploreFeedWithCount({
    skip,
    take: limit,
    viewerId,
    excludeUploaderIds,
  });

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
    },
    meta: {
      excludedFollowingCount: followingIds.length,
    },
  };
}
