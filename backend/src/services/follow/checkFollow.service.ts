// src/services/follow/checkFollow.service.ts
import { FollowerRepository } from "../../repositories/follow.repository";
import { UserRepository } from "../../repositories/user.repository";

export async function checkFollow(followerId: string, followingId: string) {
  // 1) Check target exists
  const targetUser = await UserRepository.findById(followingId);
  if (!targetUser) {
    const err: any = new Error("User not found");
    err.status = 404;
    throw err;
  }

  // 2) Check relation
  const existing = await FollowerRepository.findFollowRelation(
    followerId,
    followingId
  );

  return {
    isFollowing: !!existing,
  };
}
