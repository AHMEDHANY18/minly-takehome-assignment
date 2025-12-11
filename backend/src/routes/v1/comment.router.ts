import { Router } from "express";
import { requireAuth } from "../../middleware/auth/requireAuth";
import { validate } from "../../middleware/validate";
import { createCommentController, deleteCommentController } from "../../controllers/comment.controller";

const router = Router();
router.post(
    "/:id/add-comment",
    requireAuth,
    createCommentController
  );

  router.delete("/:commentId", requireAuth, deleteCommentController);


export default router;
