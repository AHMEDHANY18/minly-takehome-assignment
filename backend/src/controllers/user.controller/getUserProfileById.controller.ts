import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/types";
import { getUserProfileByIdService } from "../../services/user/getUserProfileById.service";

export async function getUserProfileByIdController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.params.id;

    const data = await getUserProfileByIdService(userId);

    return res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
}
