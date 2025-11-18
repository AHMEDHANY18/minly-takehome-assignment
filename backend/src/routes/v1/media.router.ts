import { Router } from "express";
import { requireAuth } from "../../middleware/auth/requireAuth";
import { mediaUpload } from "../../middleware/upload/mediaUpload"; // ✔️ الاسم الصحيح
import { uploadMediaController } from "../../controllers/media.controller/uploadMedia.controller";
import { getFeedController } from "../../controllers/media.controller/getFeed.controller";
import { getMediaByIdController } from "../../controllers/media.controller/getMediaById.controller";
import { validate } from "../../middleware/validate";
import { getMediaByIdSchema } from "../../validation/media/getMediaById.schema";

const router = Router();

router.post(
  "/",
  requireAuth,
  mediaUpload,
  uploadMediaController
);
router.get(
    "/:id",
    validate(getMediaByIdSchema),
    getMediaByIdController
  );
router.get(
    "/",
    getFeedController
  );

export default router;
