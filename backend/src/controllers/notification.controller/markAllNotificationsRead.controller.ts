import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/types";
import { markAllNotificationsReadService } from  "../../services/notification";
export async function markAllNotificationsReadController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const result = await markAllNotificationsReadService({ userId: user.id });

    return res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
