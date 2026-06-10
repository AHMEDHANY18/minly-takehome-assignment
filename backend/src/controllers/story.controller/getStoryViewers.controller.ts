import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/types";
import { getStoryViewersService } from "../../services/story/getStoryViewers.service";

export async function getStoryViewersController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const result = await getStoryViewersService({
      storyId: req.params.id,
      userId,
    });

    return res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
