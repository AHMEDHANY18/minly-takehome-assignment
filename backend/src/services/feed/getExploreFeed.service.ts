import { FeedRepository, FeedCursor } from "../../repositories/feed.repository";
import { FeedMediaItem } from "../../types/feed";

interface GetExploreFeedParams {
  page: number;
  limit: number;
  viewerId: string;
  cursor?: string | null;
}

export async function getExploreFeedService({
  page,
  limit,
  viewerId,
  cursor,
}: GetExploreFeedParams) {
  const skip = (page - 1) * limit;

  // استبعد نفسك + اللي بتتابعهم
  const followingIds = await FeedRepository.getFollowingIds(viewerId);
  const excludeUploaderIds = [viewerId, ...followingIds];

  let feedCursor: FeedCursor | null = null;
  if (cursor) {
    feedCursor = await FeedRepository.findCursorAnchor(cursor);
  }

  const [rawItems, total] =
  await FeedRepository.findExploreFeedWithCount({
    skip,
    take: limit,
    viewerId,
    excludeUploaderIds,
    cursor: feedCursor,
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
      nextCursor: items.length === limit ? items[items.length - 1].id : null,
    },
    meta: {
      excludedFollowingCount: followingIds.length,
    },
  };
}
