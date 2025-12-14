import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/types";
import { unreadCountService } from  "../../services/notification";

export async function unreadCountController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const result = await unreadCountService({ userId: user.id });

    return res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
