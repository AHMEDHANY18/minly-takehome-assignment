import { Router } from "express";
import { requireAuth } from "../../middleware/auth/requireAuth";
import { validate } from "../../middleware/validate";
import { createCommentController } from "../../controllers/comment.controller";

const router = Router();
router.post(
    "/:id/add-comment",
    requireAuth,
    createCommentController
  );

export default router;
