import { Router } from "express";
import { requireAuth } from "../../middleware/auth/requireAuth";
import { validate } from "../../middleware/validate";
import { toggleLikeSchema } from "../../validation/like/toggleLikeSchema";
import { toggleLikeController } from "../../controllers/like.controller/toggleLike.controller";

const router = Router();


router.post(
    "/:id",
    requireAuth,
    validate(toggleLikeSchema),
    toggleLikeController
  );
export default router;
