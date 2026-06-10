import { MediaRepository } from "../../repositories/media.repository";
import { HashtagRepository } from "../../repositories/hashtag.repository";

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

  // view counter — fire-and-forget, never for the uploader
  if (media.uploaderId !== viewerId) {
    MediaRepository.incrementViewsCount(mediaId).catch(() => {
      // best effort — a failed increment must never fail the request
    });
  }

  // hashtags — best effort
  let hashtags: string[] = [];
  try {
    hashtags = await HashtagRepository.getTagsForMedia(mediaId);
  } catch {
    // ignore
  }

  return {
    media: { ...media, hashtags },
    comments,
    pagination: {
      page,
      limit,
      total: totalComments,
      hasMore: skip + comments.length < totalComments,
    },
  };
}
