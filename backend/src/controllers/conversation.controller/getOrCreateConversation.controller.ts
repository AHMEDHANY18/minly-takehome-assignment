import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/types";
import { getOrCreateConversationService } from "../../services/conversation/getOrCreateConversation.service";

export async function getOrCreateConversationController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const viewerId = req.user?.id;
    if (!viewerId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const { userId } = req.body as { userId: string };

    const result = await getOrCreateConversationService(viewerId, userId);

    return res.status(200).json({ status: "success", data: result });
  } catch (err) {
    next(err);
  }
}
