// src/controllers/user/getUserProfile.controller.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth/types";
import { getUserProfileService } from "../../services/user/getUserProfile.service";

export async function getUserProfileController(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const viewerId = req.user?.id;
      if (!viewerId) {
        return res.status(401).json({ status: "error", message: "Unauthorized" });
      }

      // ✅ param name الصحيح
      const raw = req.params.userId;

      // /user/profile        -> raw = undefined -> me
      // /user/profile/me     -> raw = "me"      -> me
      // /user/profile/:uuid  -> raw = uuid      -> other
      const userId = !raw || raw === "me" ? viewerId : raw;

      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 24, 1), 50);

      const type = (req.query.type?.toString() || "ALL").toUpperCase();
      if (!["ALL", "IMAGE", "VIDEO"].includes(type)) {
        return res.status(400).json({
          status: "error",
          message: "Invalid media type. Allowed: ALL, IMAGE, VIDEO",
        });
      }

      const result = await getUserProfileService({
        viewerId,
        userId,
        page,
        limit,
        type,
      });

      return res.status(200).json({ status: "success", data: result });
    } catch (err) {
      next(err);
    }
  }
