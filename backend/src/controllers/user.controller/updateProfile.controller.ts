import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/requireAuth";
import { updateProfileService } from "../../services/user/updateProfileService";

export async function updateProfileController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    const { name } = req.body; // 👈 بس name

    const updatedUser = await updateProfileService(
      userId,
      { name },   // 👈 شيل bio
      req.file
    );

    return res.status(200).json({
      status: "success",
      data: updatedUser,
    });
  } catch (err) {
    next(err);
  }
}
