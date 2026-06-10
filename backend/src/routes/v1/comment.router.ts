import { Router } from "express";
import { requireAuth } from "../../middleware/auth/requireAuth";
import { validate } from "../../middleware/validate";
import { createCommentController, deleteCommentController } from "../../controllers/comment.controller";
import { getCommentRepliesController } from "../../controllers/comment.controller/getCommentReplies.controller";
import { editCommentController } from "../../controllers/comment.controller/editComment";
import { editCommentSchema } from "../../validation/comment/editComment.schema";

const router = Router();
router.post(
    "/:id/add-comment",
    requireAuth,
    createCommentController
  );

  router.patch(
    "/:commentId",
    requireAuth,
    validate(editCommentSchema),
    editCommentController
  );

  router.delete("/:commentId", requireAuth, deleteCommentController);

  router.get("/:commentId/replies", requireAuth, getCommentRepliesController);


export default router;
