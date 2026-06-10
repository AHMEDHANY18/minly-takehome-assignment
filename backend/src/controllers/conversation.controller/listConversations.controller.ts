import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/types";
import { listConversationsService } from "../../services/conversation/listConversations.service";

export async function listConversationsController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const viewerId = req.user?.id;
    if (!viewerId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const page = Math.max(parseInt(req.query.page as string, 10) || 1, 1);
    const limitRaw = parseInt(req.query.limit as string, 10) || 10;
    const limit = Math.min(Math.max(limitRaw, 1), 50);

    const result = await listConversationsService({ viewerId, page, limit });

    return res.status(200).json({ status: "success", data: result });
  } catch (err) {
    next(err);
  }
}
