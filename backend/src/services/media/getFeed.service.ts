import { MediaRepository } from "../../repositories/media.repository";

interface GetFeedParams {
  page?: number;
  limit?: number;
  user:string
}

export async function getFeedService(params: GetFeedParams) {
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit =
    params.limit && params.limit > 0 && params.limit <= 50
      ? params.limit
      : 20;

  const skip = (page - 1) * limit;

  const { user } = params;

  if (user) {
    // 👇 نسخة personalized فيها isLiked
    const [rawItems, total] = await Promise.all([
      MediaRepository.findManyForFeedWithUserLikes(skip, limit, user),
      MediaRepository.countAll(),
    ]);

    const items = rawItems.map((item: any) => {
      const { likes, ...rest } = item;
      return {
        ...rest,
        isLiked: likes && likes.length > 0,
      };
    });

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
}