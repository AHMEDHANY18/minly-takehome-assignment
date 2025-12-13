import { prisma } from "../config/prisma";

export const BookmarkRepository = {
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

  async isBookmarked(userId: string, mediaId: string) {
    const bookmark = await prisma.bookmark.findUnique({
      where: { userId_mediaId: { userId, mediaId } },
    });
    return Boolean(bookmark);
  },
};
