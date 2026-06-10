// src/repositories/block.repository.ts
import { prisma } from "../config/prisma";

export const BlockRepository = {
  findBlock(blockerId: string, blockedId: string) {
    return prisma.block.findUnique({
      where: {
        blockerId_blockedId: { blockerId, blockedId },
      },
    });
  },

  async isBlockedEitherWay(userAId: string, userBId: string) {
    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userAId, blockedId: userBId },
          { blockerId: userBId, blockedId: userAId },
        ],
      },
      select: { id: true },
    });
    return !!block;
  },

  /**
   * Every user id that has a block relation with `userId`
   * (blocked by me OR blocked me).
   */
  async getRelatedBlockedIds(userId: string): Promise<string[]> {
    const rows = await prisma.block.findMany({
      where: {
        OR: [{ blockerId: userId }, { blockedId: userId }],
      },
      select: { blockerId: true, blockedId: true },
    });

    const ids = new Set<string>();
    for (const row of rows) {
      ids.add(row.blockerId === userId ? row.blockedId : row.blockerId);
    }
    return [...ids];
  },

  /**
   * Creates the block and removes follow relations in both directions
   * (with their notifications) while fixing follower/following counters.
   */
  async createBlockWithCleanup(blockerId: string, blockedId: string) {
    return prisma.$transaction(async (tx) => {
      const block = await tx.block.create({
        data: { blockerId, blockedId },
      });

      const relations = await tx.follower.findMany({
        where: {
          OR: [
            { followerId: blockerId, followingId: blockedId },
            { followerId: blockedId, followingId: blockerId },
          ],
        },
      });

      for (const rel of relations) {
        await tx.notification.deleteMany({ where: { followId: rel.id } });
        await tx.follower.delete({ where: { id: rel.id } });
        await tx.user.update({
          where: { id: rel.followerId },
          data: { followingCount: { decrement: 1 } },
        });
        await tx.user.update({
          where: { id: rel.followingId },
          data: { followerCount: { decrement: 1 } },
        });
      }

      return block;
    });
  },

  deleteBlock(blockId: string) {
    return prisma.block.delete({ where: { id: blockId } });
  },

  listBlockedUsers(blockerId: string) {
    return prisma.block.findMany({
      where: { blockerId },
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        blocked: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });
  },
};
