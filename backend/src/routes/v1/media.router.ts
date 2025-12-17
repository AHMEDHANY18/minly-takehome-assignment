import { Router } from "express";
import { requireAuth } from "../../middleware/auth/requireAuth";
import { mediaUpload } from "../../middleware/upload/mediaUpload";
import { uploadMediaController } from "../../controllers/media.controller/uploadMedia.controller";
import { getFeedController } from "../../controllers/media.controller/getFeed.controller";
import { getMediaByIdController } from "../../controllers/media.controller/getMediaById.controller";
import { validate } from "../../middleware/validate";
import { getMediaByIdSchema } from "../../validation/media/getMediaById.schema";
import { deleteMediaController } from "../../controllers/media.controller/deleteMedia.controller";
import { updateMediaSchema } from "../../validation/media/updateMedia.schema";
import { updateMediaController } from "../../controllers/media.controller/updateMedia.controller";
import { deleteMediaSchema } from "../../validation/media/deleteMedia.schema";
import { createMediaSchema } from "../../validation/media/createMedia.schema";
import { presignMediaUploadController } from "../../controllers/media.controller/presignMedia.controller";
import { finalizeMediaUploadController } from "../../controllers/media.controller/finalizeMedia.controller";
import { getMediaCommentsController } from "../../controllers/media.controller/getMediaComments.controller";
import { getCommentRepliesController } from "../../controllers/comment.controller/getCommentReplies.controller";
import { getMediaDetailsController } from "../../controllers/media.controller/getMediaDetails.controller";

const router = Router();

// ✅ static first
router.post("/presign", requireAuth, presignMediaUploadController);
router.post("/finalize", requireAuth, finalizeMediaUploadController);

router.get(
  "/:mediaId/details",
  requireAuth,
  getMediaDetailsController
);

router.patch("/:id", requireAuth, validate(updateMediaSchema), updateMediaController);
router.delete("/:id", requireAuth, validate(deleteMediaSchema), deleteMediaController);

export default router;
