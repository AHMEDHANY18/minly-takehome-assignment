import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/types";
import { listBlockedService } from "../../services/block/listBlocked.service";

export async function listBlockedController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const result = await listBlockedService(userId);

    return res.status(200).json({ status: "success", data: result });
  } catch (err) {
    next(err);
  }
}
