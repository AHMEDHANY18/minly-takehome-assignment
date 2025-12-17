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

  const { page, limit, sort, type } = options;

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
    data: items.map((b) => b.media), // ✅ تمام
    pagination: {
      page,
      limit,
      total,
      hasNext: skip + items.length < total,
    },
  };
}
