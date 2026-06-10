import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/types";
import { adminDeleteMediaService } from "../../services/admin/adminDeleteMedia.service";

export async function deleteMediaAdminController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const mediaId = req.params.id;
    const adminId = req.user!.id;

    const result = await adminDeleteMediaService(mediaId, adminId);

    return res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
