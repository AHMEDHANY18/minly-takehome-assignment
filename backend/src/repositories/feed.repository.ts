// src/repositories/feed.repository.ts
import { prisma } from "../config/prisma";

function feedSelect(viewerId: string) {
  return {
    id: true,
    url: true,
    thumbnailUrl: true,
    type: true,
    title: true,
    description: true,
    uploaderId: true,
    likesCount: true,
    commentCount: true,
    createdAt: true,
    uploader: {
      select: { id: true, name: true, avatarUrl: true },
    },
    likes: {
      where: { userId: viewerId },
      select: { id: true },
    },
    bookmarks: {
      where: { userId: viewerId },
      select: { id: true },
    },
  } as const;
}

export const FeedRepository = {
  // -------------------------
  // Social graph
  // -------------------------
  async getFollowingIds(viewerId: string): Promise<string[]> {
    const rows = await prisma.follower.findMany({
      where: { followerId: viewerId },
      select: { followingId: true },
    });
    return rows.map((r) => r.followingId);
  },

  // -------------------------
  // Home feed (Following)
  // -------------------------
  async findHomeFeedWithViewer(params: {
    skip: number;
    take: number;
    viewerId: string;
    followingIds: string[];
  }) {
    const { skip, take, viewerId, followingIds } = params;
    if (followingIds.length === 0) return [];

    return prisma.media.findMany({
      skip,
      take,
      where: {
        uploaderId: { in: followingIds },
      },
      orderBy: { createdAt: "desc" },
      select: feedSelect(viewerId),
    });
  },

  async countHomeFeed(params: { followingIds: string[] }) {
    const { followingIds } = params;
    if (followingIds.length === 0) return 0;

    return prisma.media.count({
      where: {
        uploaderId: { in: followingIds },
      },
    });
  },

  // -------------------------
  // Fallback feed (Recommended)
  // -------------------------
  async findFallbackFeedWithViewer(params: {
    skip: number;
    take: number;
    viewerId: string;
    excludeUploaderIds: string[];
  }) {
    const { skip, take, viewerId, excludeUploaderIds } = params;

    return prisma.media.findMany({
      skip,
      take,
      where: {
        uploaderId: { notIn: excludeUploaderIds },
      },
      // ✅ استخدم الـ scalars الموجودة عندك (أفضل أداء من _count relations)
      orderBy: [
        { likesCount: "desc" },
        { commentCount: "desc" },
        { createdAt: "desc" },
      ],
      select: feedSelect(viewerId),
    });
  },

  async countFallbackFeed(params: { excludeUploaderIds: string[] }) {
    const { excludeUploaderIds } = params;

    return prisma.media.count({
      where: {
        uploaderId: { notIn: excludeUploaderIds },
      },
    });
  },

  // -------------------------
  // Explore (Discovery)
  // -------------------------
  async findExploreFeedWithViewer(params: {
    skip: number;
    take: number;
    viewerId: string;
    excludeUploaderIds: string[];
  }) {
    const { skip, take, viewerId, excludeUploaderIds } = params;

    return prisma.media.findMany({
      skip,
      take,
      where: {
        uploaderId: { notIn: excludeUploaderIds },
      },
      orderBy: [
        { likesCount: "desc" },
        { commentCount: "desc" },
        { createdAt: "desc" },
      ],
      select: feedSelect(viewerId),
    });
  },

  async countExploreFeed(params: { excludeUploaderIds: string[] }) {
    const { excludeUploaderIds } = params;

    return prisma.media.count({
      where: {
        uploaderId: { notIn: excludeUploaderIds },
      },
    });
  },

  // -------------------------
  // Trending
  // -------------------------
  async findTrendingFeedWithViewer(params: {
    skip: number;
    take: number;
    viewerId: string;
    windowHours: number;
  }) {
    const { skip, take, viewerId, windowHours } = params;

    const windowStart = new Date(Date.now() - windowHours * 60 * 60 * 1000);

    return prisma.media.findMany({
      skip,
      take,
      where: {
        createdAt: { gte: windowStart },
      },
      orderBy: [
        { likesCount: "desc" },
        { commentCount: "desc" },
        { createdAt: "desc" },
      ],
      select: feedSelect(viewerId),
    });
  },

  async countTrendingFeed(params: { windowHours: number }) {
    const { windowHours } = params;
    const windowStart = new Date(Date.now() - windowHours * 60 * 60 * 1000);

    return prisma.media.count({
      where: {
        createdAt: { gte: windowStart },
      },
    });
  },
};
