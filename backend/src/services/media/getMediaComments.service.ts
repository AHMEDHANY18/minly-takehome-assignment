import { MediaRepository } from "../../repositories/media.repository";

interface Params {
  mediaId: string;
  page: number;
  limit: number;
  viewerId: string;
}

export async function getMediaCommentsService({
  mediaId,
  page,
  limit,
  viewerId,
}: Params) {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    MediaRepository.findTopLevelByMedia({
      mediaId,
      skip,
      take: limit,
      viewerId,
    }),
    MediaRepository.countTopLevelByMedia(mediaId),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
