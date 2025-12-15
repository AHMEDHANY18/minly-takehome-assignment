import { FeedRepository } from "../../repositories/feed.repository";
import { FeedMediaItem } from "../../types/feed";

interface GetTrendingFeedParams {
  page: number;
  limit: number;
  windowHours: number;
  viewerId: string;
}

export async function getTrendingFeedService({
  page,
  limit,
  windowHours,
  viewerId,
}: GetTrendingFeedParams) {
  const skip = (page - 1) * limit;

  const [rawItems, total] = await Promise.all([
    FeedRepository.findTrendingFeedWithViewer({
      skip,
      take: limit,
      windowHours,
      viewerId,
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

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
