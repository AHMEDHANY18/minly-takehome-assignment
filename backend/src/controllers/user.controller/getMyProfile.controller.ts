import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/types";
import { getMyProfileService } from "../../services/user/getMyProfile.service";

export async function getMyProfileController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const data = await getMyProfileService(userId);

    return res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
}
