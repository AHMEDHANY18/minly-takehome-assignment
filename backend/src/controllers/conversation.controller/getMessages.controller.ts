import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/types";
import { getMessagesService } from "../../services/conversation/getMessages.service";

export async function getMessagesController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const viewerId = req.user?.id;
    if (!viewerId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const conversationId = req.params.id;
    const cursor = (req.query.cursor as string) || null;
    const limitRaw = parseInt(req.query.limit as string, 10) || 20;
    const limit = Math.min(Math.max(limitRaw, 1), 50);

    const result = await getMessagesService({
      viewerId,
      conversationId,
      limit,
      cursor,
    });

    return res.status(200).json({ status: "success", data: result });
  } catch (err) {
    next(err);
  }
}
