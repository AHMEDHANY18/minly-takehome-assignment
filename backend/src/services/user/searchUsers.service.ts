// src/services/user/searchUsers.service.ts
import { UserRepository } from "../../repositories/user.repository";
import { BlockRepository } from "../../repositories/block.repository";
import { FeedRepository } from "../../repositories/feed.repository";

interface SearchUsersParams {
  viewerId: string;
  q: string;
  page: number;
  limit: number;
}

export async function searchUsersService({
  viewerId,
  q,
  page,
  limit,
}: SearchUsersParams) {
  const skip = (page - 1) * limit;

  const [blockedIds, followingIds] = await Promise.all([
    BlockRepository.getRelatedBlockedIds(viewerId),
    FeedRepository.getFollowingIds(viewerId),
  ]);

  // exclude self + block-related users (both directions)
  const excludeIds = [viewerId, ...blockedIds];

  const [rawUsers, total] = await UserRepository.searchUsers({
    q,
    excludeIds,
    skip,
    take: limit,
  });

  const followingSet = new Set(followingIds);

  const users = rawUsers.map((user) => ({
    ...user,
    isFollowing: followingSet.has(user.id),
  }));

  return {
    users,
    page,
    limit,
    total,
    hasMore: skip + users.length < total,
  };
}
