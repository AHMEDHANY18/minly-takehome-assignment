import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/types";
import { markConversationReadService } from "../../services/conversation/markConversationRead.service";

export async function markConversationReadController(
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

    const result = await markConversationReadService(viewerId, conversationId);

    return res.status(200).json({ status: "success", data: result });
  } catch (err) {
    next(err);
  }
}
