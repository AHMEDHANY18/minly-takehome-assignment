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
    const { name,email } = req.body; // 👈 بس name

    const updatedUser = await updateProfileService(
      userId,
      { name,email },   // 👈 شيل bio
      req.file
    );
    console.log("🚀 ~ updatedUser:", updatedUser)

    return res.status(200).json({
      status: "success",
      data: updatedUser,
    });
  } catch (err) {
    next(err);
  }
}
