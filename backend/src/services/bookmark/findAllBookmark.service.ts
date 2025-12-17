import { BookmarkRepository } from "../../repositories/bookmark.repository";

export async function getBookmarksService(
  userId: string,
  options: {
    page: number;
    limit: number;
    sort?: "recent" | "oldest" | "popularity";
    type?: "image" | "video";
  }
) {
  if (!userId) {
    const err: any = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }

  const page = Math.max(Number(options.page) || 1, 1);
  const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 50);

  const { sort, type } = options;

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    BookmarkRepository.findByUserId(userId, {
      skip,
      take: limit,
      sort,
      type,
    }),
    BookmarkRepository.countByUserId(userId, type),
  ]);

  return {
    data: items.map((b) => b.media),
    pagination: {
      page,
      limit,
      total,
      hasNext: skip + items.length < total,
    },
  };
}
