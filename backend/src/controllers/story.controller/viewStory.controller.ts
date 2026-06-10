import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/types";
import { viewStoryService } from "../../services/story/viewStory.service";

export async function viewStoryController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const viewerId = req.user?.id;
    if (!viewerId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const result = await viewStoryService({
      storyId: req.params.id,
      viewerId,
    });

    return res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
