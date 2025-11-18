import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/requireAuth";
import { updateProfileService } from "../../services/user/updateProfile.service";

export async function updateProfileController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    const { name, bio } = req.body;
    const avatar = req.file;

    const updatedUser = await updateProfileService(userId, { name, bio }, avatar);

    return res.status(200).json({
      status: "success",
      data: updatedUser,
    });
  } catch (err) {
    next(err);
  }
}
