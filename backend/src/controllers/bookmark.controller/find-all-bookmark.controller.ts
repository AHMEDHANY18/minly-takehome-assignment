import { Request, Response, NextFunction } from "express";
import { getBookmarksService } from "../../services/bookmark/findAllBookmark.service";

export async function getBookmarksController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;

    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);

    const sort = req.query.sort as "recent" | "oldest" | "popularity" | undefined;
    const type = req.query.type as "image" | "video" | undefined;

    const result = await getBookmarksService(userId, {
      page,
      limit,
      sort,
      type,
    });

    res.json({
      status: "success",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}
