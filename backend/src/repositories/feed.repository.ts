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

export type FeedCursor = { createdAt: Date; id: string };

// boundary clause for cursor-based (createdAt/id) pagination
function cursorWhere(cursor: FeedCursor) {
  return {
    OR: [
      { createdAt: { lt: cursor.createdAt } },
      { createdAt: cursor.createdAt, id: { lt: cursor.id } },
    ],
  };
}

const cursorOrderBy = [
  { createdAt: "desc" as const },
  { id: "desc" as const },
];

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
    cursor?: FeedCursor | null;
  }) {
    const { skip, take, viewerId, followingIds, cursor } = params;
    if (followingIds.length === 0) return [];

    return prisma.media.findMany({
      skip: cursor ? 0 : skip,
      take,
      where: {
        uploaderId: { in: followingIds },
        ...(cursor ? cursorWhere(cursor) : {}),
      },
      orderBy: cursor ? cursorOrderBy : { createdAt: "desc" },
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
    cursor?: FeedCursor | null;
  }) {
    const { skip, take, viewerId, excludeUploaderIds, cursor } = params;

    return prisma.media.findMany({
      skip: cursor ? 0 : skip,
      take,
      where: {
        uploaderId: { notIn: excludeUploaderIds },
        ...(cursor ? cursorWhere(cursor) : {}),
      },
      orderBy: cursor
        ? cursorOrderBy
        : [
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
  async findExploreFeedWithCount(params: {
    skip: number;
    take: number;
    viewerId: string;
    excludeUploaderIds: string[];
    cursor?: FeedCursor | null;
  }) {
    const { skip, take, viewerId, excludeUploaderIds, cursor } = params;

    return prisma.$transaction([
      prisma.media.findMany({
        skip: cursor ? 0 : skip,
        take,
        where: {
          uploaderId: { notIn: excludeUploaderIds },
          ...(cursor ? cursorWhere(cursor) : {}),
        },
        orderBy: cursor
          ? cursorOrderBy
          : [
              { likesCount: "desc" },
              { commentCount: "desc" },
              { createdAt: "desc" },
            ],
        select: feedSelect(viewerId),
      }),

      prisma.media.count({
        where: {
          uploaderId: { notIn: excludeUploaderIds },
        },
      }),
    ]);
  },

  // -------------------------
  // Trending
  // -------------------------
  async findTrendingFeedWithViewer(params: {
    skip: number;
    take: number;
    viewerId: string;
    windowHours: number;
    cursor?: FeedCursor | null;
  }) {
    const { skip, take, viewerId, windowHours, cursor } = params;

    const windowStart = new Date(Date.now() - windowHours * 60 * 60 * 1000);

    return prisma.media.findMany({
      skip: cursor ? 0 : skip,
      take,
      where: {
        createdAt: { gte: windowStart },
        ...(cursor ? cursorWhere(cursor) : {}),
      },
      orderBy: cursor
        ? cursorOrderBy
        : [
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

  // -------------------------
  // Cursor anchor
  // -------------------------
  findCursorAnchor(mediaId: string) {
    return prisma.media.findUnique({
      where: { id: mediaId },
      select: { id: true, createdAt: true },
    });
  },

  // -------------------------
  // Search (title / description / hashtag)
  // -------------------------
  async searchMediaWithCount(params: {
    q: string;
    viewerId: string;
    skip: number;
    take: number;
  }) {
    const { q, viewerId, skip, take } = params;

    const where = {
      OR: [
        { title: { contains: q, mode: "insensitive" as const } },
        { description: { contains: q, mode: "insensitive" as const } },
        {
          hashtags: {
            some: { hashtag: { tag: { contains: q.toLowerCase() } } },
          },
        },
      ],
    };

    return prisma.$transaction([
      prisma.media.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: feedSelect(viewerId),
      }),
      prisma.media.count({ where }),
    ]);
  },

  // -------------------------
  // Hashtag feed
  // -------------------------
  async findHashtagFeedWithCount(params: {
    tag: string;
    viewerId: string;
    skip: number;
    take: number;
  }) {
    const { tag, viewerId, skip, take } = params;

    const where = {
      hashtags: { some: { hashtag: { tag: tag.toLowerCase() } } },
    };

    return prisma.$transaction([
      prisma.media.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: feedSelect(viewerId),
      }),
      prisma.media.count({ where }),
    ]);
  },
};
