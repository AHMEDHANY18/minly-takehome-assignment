// src/controllers/user.controller/getUserProfileById.controller.ts
import { Request, Response, NextFunction } from "express";
import { getUserProfileByIdService } from "../../services/user/getUserProfileById.service";

export async function getUserProfileByIdController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.params.id;

    const profile = await getUserProfileByIdService(userId);
    console.log("🚀 ~ profile:", profile)

    return res.status(200).json({
      status: "success",
      data: profile,
    });
  } catch (err) {
    next(err);
  }
}
