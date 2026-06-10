// src/repositories/hashtag.repository.ts
import { prisma } from "../config/prisma";

export const HashtagRepository = {
  /**
   * Makes MediaHashtag rows for `mediaId` match `tags` exactly
   * (creates missing Hashtag rows, removes stale links).
   */
  async syncMediaHashtags(mediaId: string, tags: string[]) {
    const hashtagIds: string[] = [];

    for (const tag of tags) {
      const hashtag = await prisma.hashtag.upsert({
        where: { tag },
        update: {},
        create: { tag },
      });
      hashtagIds.push(hashtag.id);
    }

    await prisma.$transaction([
      prisma.mediaHashtag.deleteMany({
        where: { mediaId, hashtagId: { notIn: hashtagIds } },
      }),
      ...hashtagIds.map((hashtagId) =>
        prisma.mediaHashtag.upsert({
          where: { mediaId_hashtagId: { mediaId, hashtagId } },
          update: {},
          create: { mediaId, hashtagId },
        })
      ),
    ]);
  },

  async getTagsForMedia(mediaId: string): Promise<string[]> {
    const rows = await prisma.mediaHashtag.findMany({
      where: { mediaId },
      select: { hashtag: { select: { tag: true } } },
    });
    return rows.map((r) => r.hashtag.tag);
  },
};
