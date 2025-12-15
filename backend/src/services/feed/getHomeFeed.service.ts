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

  // Home = following فقط
  if (followingIds.length === 0) {
    return {
      items: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
      meta: {
        mode: "empty",
        message: "Follow users to see posts in your home feed",
      },
    };
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
      mode: "home",
      followingCount: followingIds.length,
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
