// src/services/media/getHashtagFeed.service.ts
import { FeedRepository } from "../../repositories/feed.repository";
import { FeedMediaItem } from "../../types/feed";

interface GetHashtagFeedParams {
  viewerId: string;
  tag: string;
  page: number;
  limit: number;
}

export async function getHashtagFeedService({
  viewerId,
  tag,
  page,
  limit,
}: GetHashtagFeedParams) {
  const skip = (page - 1) * limit;

  const [rawItems, total] = await FeedRepository.findHashtagFeedWithCount({
    tag,
    viewerId,
    skip,
    take: limit,
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
    page,
    limit,
    total,
    hasMore: skip + items.length < total,
  };
}
