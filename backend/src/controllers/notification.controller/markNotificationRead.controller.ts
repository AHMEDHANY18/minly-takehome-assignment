import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/types";
import { markNotificationReadService } from  "../../services/notification";

export async function markNotificationReadController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Missing notification id" });

    const result = await markNotificationReadService({
      userId: user.id,
      notificationId: id,
    });

    return res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
