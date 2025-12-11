// src/services/follow/follow.service.ts
import { FollowerRepository } from "../../repositories/follow.repository";
import { UserRepository } from "../../repositories/user.repository";

export async function toggleFollowService(
  followerId: string,
  followingId: string
) {
  if (followerId === followingId) {
    const err: any = new Error("You cannot follow yourself");
    err.status = 400;
    throw err;
  }

  const targetUser = await UserRepository.findById(followingId);
  if (!targetUser) {
    const err: any = new Error("User not found");
    err.status = 404;
    throw err;
  }

  const existing = await FollowerRepository.findFollowRelation(
    followerId,
    followingId
  );

  // -----------------------------
  // FOLLOW
  // -----------------------------
  if (!existing) {
    await FollowerRepository.createFollow(followerId, followingId);
    await FollowerRepository.incrementCounters(followerId, followingId);

    return {
      isFollowing: true,
      message: "Followed successfully",
    };
  }

  // -----------------------------
  // UNFOLLOW
  // -----------------------------
  await FollowerRepository.deleteFollow(followerId, followingId);
  await FollowerRepository.decrementCounters(followerId, followingId);

  return {
    isFollowing: false,
    message: "Unfollowed successfully",
  };
}
