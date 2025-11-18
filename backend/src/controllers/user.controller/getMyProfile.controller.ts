// src/controllers/user.controller/getMyProfile.controller.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/requireAuth";
import { getMyProfileService } from "../../services/user/getMyProfile.service";

export async function getMyProfileController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;

    const profile = await getMyProfileService(userId);

    return res.status(200).json({
      status: "success",
      data: profile,
    });
  } catch (err) {
    next(err);
  }
}
