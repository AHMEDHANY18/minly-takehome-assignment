import { Request, Response, NextFunction } from "express";
import { getMediaByIdService } from "../../services/media/getMediaById.service";

export async function getMediaByIdController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const mediaId = req.params.id;

    const media = await getMediaByIdService(mediaId);

    return res.status(200).json({
      status: "success",
      data: media,
    });
  } catch (err) {
    next(err);
  }
}
