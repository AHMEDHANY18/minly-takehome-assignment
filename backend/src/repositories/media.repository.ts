import { prisma } from "../config/prisma";

export const MediaRepository = {
  async createMedia(data: {
    url: string;
    type: "IMAGE" | "VIDEO";
    title?: string;
    description?: string;
    uploaderId: string;
  }) {
    return prisma.media.create({ data });
  },

  async incrementUserMediaCount(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { mediaCount: { increment: 1 } },
    });
  },
  async findByIdDetailedForViewer(mediaId: string, viewerId: string) {
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      include: {
        uploader: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    if (!media) return null;

    const [like, bookmark] = await Promise.all([
      prisma.like.findFirst({
        where: { mediaId, userId: viewerId },
        select: { id: true },
      }),
      prisma.bookmark.findFirst({
        where: { mediaId, userId: viewerId },
        select: { id: true },
      }),
    ]);

    return {
      ...media,
      isLiked: !!like,
      isBookmarked: !!bookmark,
    };
  },

  async createMediaWithCounter(data: {
    url: string;
    type: "IMAGE" | "VIDEO";
    title?: string;
    description?: string;
    uploaderId: string;
  }) {
    //Weak Consistency
    const [media] = await prisma.$transaction([
      prisma.media.create({ data }),
      prisma.user.update({
        where: { id: data.uploaderId },
        data: { mediaCount: { increment: 1 } },
      }),
    ]);

    return media;
  },

  async getMediaById(mediaId: string) {
    return prisma.media.findUnique({
      where: { id: mediaId },
    });
  },

  // ✅ CORRECTED: This handles the Like_mediaId_fkey error
  // It deletes the Likes first, then the Media
  async deleteById(id: string) {
    return prisma.$transaction([
      // 1. Delete all likes associated with this media first
      prisma.like.deleteMany({
        where: { mediaId: id },
      }),
      // 2. Then delete the media itself
      prisma.media.delete({
        where: { id },
      }),
    ]);
  },

  async getUserMedia(userId: string) {
    return prisma.media.findMany({
      where: { uploaderId: userId },
      orderBy: { createdAt: "desc" },
    });
  },

  async getFeed(limit: number, skip: number) {
    return prisma.media.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    });
  },

  async findManyForFeed(skip: number, take: number) {
    return prisma.media.findMany({
      skip,
      take,
      orderBy: { likesCount: "desc" },
      select: {
        id: true,
        url: true,
        thumbnailUrl: true,
        type: true,
        title: true,
        description: true,
        uploaderId: true,
        likesCount: true,
        createdAt: true,
        uploader: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  },

  async findManyForFeedWithUserLikes(
    skip: number,
    take: number,
    userId: string
  ) {
    return prisma.media.findMany({
      skip,
      take,
      orderBy: { likesCount: "desc" },
      select: {
        id: true,
        url: true,
        thumbnailUrl: true,
        type: true,
        title: true,
        description: true,
        uploaderId: true,
        likesCount: true,
        createdAt: true,
        commentCount: true,
        comments: {
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        uploader: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        // هنا الـ join / include على likes
        likes: {
          where: { userId }, // يرجّع likes بتاعة اليوزر ده بس
          select: { id: true }, // مش محتاجين أكتر من كده
        },
      },
    });
  },

  async countAll() {
    return prisma.media.count();
  },

  async findById(id: string) {
    return prisma.media.findUnique({
      where: { id },
      select: {
        id: true,
        uploaderId: true,
        likesCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },


  async findByIdDetailed(id: string) {
    return prisma.media.findUnique({
      where: { id },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  },

  async findByIdDetailedForDelete(id: string) {
    return prisma.media.findUnique({
      where: { id },
      select: {
        id: true,
        url: true,
        uploaderId: true,
      },
    });
  },

  async decrementUserMediaCount(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { mediaCount: { decrement: 1 } },
    });
  },

  async updateMedia(mediaId: string, data: any) {
    return prisma.media.update({
      where: { id: mediaId },
      data,
    });
  },

  async findByIdWithUploader(mediaId: string) {
    return prisma.media.findUnique({
      where: { id: mediaId },
      select: {
        id: true,
        uploaderId: true,
        title: true,
        description: true,
      },
    });
  },

  async countLikesForMedia(mediaId: string) {
    return prisma.like.count({
      where: { mediaId },
    });
  },

  async deleteMediaWithCounters(params: {
    mediaId: string;
    userId: string;
    likesToDeduct: number;
  }) {
    const { mediaId, userId, likesToDeduct } = params;

    await prisma.$transaction([
      prisma.like.deleteMany({ where: { mediaId } }),
      prisma.media.delete({ where: { id: mediaId } }),
      prisma.user.update({
        where: { id: userId },
        data: {
          mediaCount: { decrement: 1 },
          totalLikesReceived: { decrement: likesToDeduct },
        },
      }),
    ]);
  },

  async findTopLevelByMedia(params: {
    mediaId: string;
    skip: number;
    take: number;
    viewerId: string;
  }) {
    const { mediaId, skip, take, viewerId } = params;

    return prisma.threadedComment.findMany({
      where: {
        mediaId,
        parentCommentId: null, // ✅ top-level only
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        text: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            replies: true, // عدد الردود
          },
        },
      },
    });
  },

  async countTopLevelByMedia(mediaId: string) {
    return prisma.threadedComment.count({
      where: {
        mediaId,
        parentCommentId: null,
      },
    });
  },


};
