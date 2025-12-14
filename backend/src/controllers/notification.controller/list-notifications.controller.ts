import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/types";
import { listNotificationsService } from "../../services/notification";

export async function listNotificationsController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const result = await listNotificationsService({
      userId: user.id,
      page: req.query.page?.toString(),
      limit: req.query.limit?.toString(),
      type: req.query.type?.toString(),
      isRead: req.query.isRead?.toString(),
      q: req.query.q?.toString(),
    });

    return res.status(200).json({
      status: "success",
      data: result.items,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}
