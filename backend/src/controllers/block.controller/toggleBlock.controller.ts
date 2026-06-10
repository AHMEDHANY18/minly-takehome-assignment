import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/types";
import { toggleBlockService } from "../../services/block/toggleBlock.service";

export async function toggleBlockController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const blockerId = req.user?.id;
    if (!blockerId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const blockedId = req.params.userId;

    const result = await toggleBlockService(blockerId, blockedId);

    return res.status(200).json({ status: "success", data: result });
  } catch (err) {
    next(err);
  }
}
