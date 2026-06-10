import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/types";
import { sendMessageService } from "../../services/conversation/sendMessage.service";

export async function sendMessageController(
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
    const { text } = req.body as { text: string };

    const message = await sendMessageService({
      viewerId,
      conversationId,
      text,
    });

    return res.status(201).json({ status: "success", data: { message } });
  } catch (err) {
    next(err);
  }
}
