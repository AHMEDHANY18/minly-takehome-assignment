import { MediaRepository } from "../../repositories/media.repository";

export async function getMediaDetailsService(params: {
  mediaId: string;
  viewerId: string;
  page: number;
  limit: number;
}) {
  const { mediaId, viewerId, page, limit } = params;
  const skip = (page - 1) * limit;

  const [media, comments, totalComments] = await Promise.all([
    MediaRepository.findByIdDetailedForViewer(mediaId, viewerId),
    MediaRepository.findTopLevelByMedia({
      mediaId,
      skip,
      take: limit,
      viewerId,
    }),
    MediaRepository.countTopLevelByMedia(mediaId),
  ]);

  if (!media) {
    const err: any = new Error("Media not found");
    err.status = 404;
    throw err;
  }

  return {
    media,
    comments,
    pagination: {
      page,
      limit,
      total: totalComments,
      hasMore: skip + comments.length < totalComments,
    },
  };
}
