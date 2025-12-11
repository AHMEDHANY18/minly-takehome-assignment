// src/repositories/follower.repository.ts
import { prisma } from "../config/prisma";

export const FollowerRepository = {
  async findFollowRelation(followerId: string, followingId: string) {
    return prisma.follower.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });
  },

  async createFollow(followerId: string, followingId: string) {
    return prisma.follower.create({
      data: { followerId, followingId },
    });
  },

  async deleteFollow(followerId: string, followingId: string) {
    return prisma.follower.delete({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });
  },

  async incrementCounters(followerId: string, followingId: string) {
    return prisma.$transaction([
      prisma.user.update({
        where: { id: followerId },
        data: { followingCount: { increment: 1 } },
      }),
      prisma.user.update({
        where: { id: followingId },
        data: { followerCount: { increment: 1 } },
      }),
    ]);
  },

  async decrementCounters(followerId: string, followingId: string) {
    return prisma.$transaction([
      prisma.user.update({
        where: { id: followerId },
        data: { followingCount: { decrement: 1 } },
      }),
      prisma.user.update({
        where: { id: followingId },
        data: { followerCount: { decrement: 1 } },
      }),
    ]);
  },
};
