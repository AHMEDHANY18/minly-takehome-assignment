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

    // Safety guard (حتى لو الـ service عمل check)
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
  // Explore (Discovery)
  // -------------------------
  async findExploreFeedWithViewer(params: {
    skip: number;
    take: number;
    viewerId: string;
    excludeUploaderIds: string[]; // غالبًا: [viewerId, ...followingIds]
  }) {
    const { skip, take, viewerId, excludeUploaderIds } = params;

    return prisma.media.findMany({
      skip,
      take,
      where: {
        uploaderId: { notIn: excludeUploaderIds },
      },
      // Explore v1: popular then recent
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
  // Trending (Ranking v1) - Prisma only
  // -------------------------
  async findTrendingFeedWithViewer(params: {
    skip: number;
    take: number;
    viewerId: string;
    windowHours: number; // default 48 (clamp in controller/service)
  }) {
    const { skip, take, viewerId, windowHours } = params;

    const windowStart = new Date(Date.now() - windowHours * 60 * 60 * 1000);

    return prisma.media.findMany({
      skip,
      take,
      where: {
        createdAt: { gte: windowStart },
      },
      // Trending v1: engagement within window + recent as tiebreaker
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
