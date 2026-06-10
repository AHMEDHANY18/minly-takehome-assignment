import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/types";
import { createStoryService } from "../../services/story/createStory.service";

export async function createStoryController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const { url, type } = req.body as { url: string; type: "IMAGE" | "VIDEO" };

    const result = await createStoryService({ userId, url, type });

    return res.status(201).json({
      status: "success",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
