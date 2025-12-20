import { Response, NextFunction } from "express";
import { updateProfileService } from "../../services/user/updateProfile.service";
import { AuthRequest } from "../../middleware/auth/types";

export async function updateProfileController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    const { name, email } = req.body;

    const updatedUser = await updateProfileService(
      userId,
      { name, email },
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
