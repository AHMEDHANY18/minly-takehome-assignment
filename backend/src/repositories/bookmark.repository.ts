import { prisma } from "../config/prisma";
import { Prisma } from "@prisma/client";

export type BookmarkSort = "recent" | "oldest" | "popularity";
export type MediaTypeFilter = "image" | "video";

export const BookmarkRepository = {
  // ------------------------
  // Toggle bookmark
  // ------------------------
  async toggle(userId: string, mediaId: string) {
    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_mediaId: { userId, mediaId },
      },
    });

    if (existing) {
      await prisma.bookmark.delete({
        where: { id: existing.id },
      });

      return { bookmarked: false };
    }

    await prisma.bookmark.create({
      data: { userId, mediaId },
    });

    return { bookmarked: true };
  },

  // ------------------------
  // Check bookmark
  // ------------------------
  async isBookmarked(userId: string, mediaId: string) {
    const bookmark = await prisma.bookmark.findUnique({
      where: { userId_mediaId: { userId, mediaId } },
    });

    return Boolean(bookmark);
  },

  // ------------------------
  // Get bookmarks with filters
  // ------------------------
  async findByUserId(
    userId: string,
    params: {
      skip: number;
      take: number;
      sort?: BookmarkSort;
      type?: MediaTypeFilter;
    }
  ) {
    const { skip, take, sort, type } = params;

    const orderBy: Prisma.BookmarkOrderByWithRelationInput[] = [];

    if (sort === "oldest") {
      orderBy.push({ createdAt: "asc" });
    } else if (sort === "popularity") {
      // ترتيب حسب شعبية الميديا (عدد اللايكس مثلاً)
      orderBy.push({
        media: {
          likesCount: "desc", // ⚠️ لازم يكون موجود في Media
        },
      });
    } else {
      // recent (default)
      orderBy.push({ createdAt: "desc" });
    }

    return prisma.bookmark.findMany({
      where: {
        userId,
        media: { type: "IMAGE" }
      },
      include: {
        media: {
          include: {
            uploader: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      skip,
      take,
      orderBy,
    });
  },

  // ------------------------
  // Count bookmarks
  // ------------------------
  async countByUserId(userId: string, type?: MediaTypeFilter) {
    return prisma.bookmark.count({
      where: {
        userId,
        media: { type: "IMAGE" }
      }

    });
  },
};
