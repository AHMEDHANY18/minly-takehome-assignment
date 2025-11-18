import { MediaRepository } from "../../repositories/media.repository";

interface GetFeedParams {
  page?: number;
  limit?: number;
}

export async function getFeedService(params: GetFeedParams) {
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit =
    params.limit && params.limit > 0 && params.limit <= 50
      ? params.limit
      : 20;

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    MediaRepository.findManyForFeed(skip, limit),
    MediaRepository.countAll(),
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
