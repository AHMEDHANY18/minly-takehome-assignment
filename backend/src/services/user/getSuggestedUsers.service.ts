import { FeedRepository } from "../../repositories/feed.repository";
import { UserRepository } from "../../repositories/user.repository";

interface GetSuggestedUsersParams {
  viewerId: string;
  limit: number;
}

export async function getSuggestedUsersService({
  viewerId,
  limit,
}: GetSuggestedUsersParams) {
  // الناس اللي أنا متابعهم (عشان نستبعدهم)
  const followingIds = await FeedRepository.getFollowingIds(viewerId);

  const excludeIds = [viewerId, ...followingIds];

  const items = await UserRepository.findSuggestedUsers({
    excludeIds,
    limit,
  });

  return {
    items,
    meta: {
      excludedFollowingCount: followingIds.length,
    },
  };
}
