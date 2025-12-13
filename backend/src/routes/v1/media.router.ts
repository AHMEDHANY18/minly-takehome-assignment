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

const router = Router();

router.post("/", requireAuth, mediaUpload, validate(createMediaSchema), uploadMediaController);

router.get("/:id", validate(getMediaByIdSchema), getMediaByIdController);

router.get("/", requireAuth,getFeedController);

router.delete("/:id", requireAuth, validate(deleteMediaSchema), deleteMediaController);

router.patch("/:id", requireAuth, validate(updateMediaSchema), updateMediaController);

router.post("/presign", requireAuth, presignMediaUploadController);
router.post("/finalize", requireAuth, finalizeMediaUploadController);
export default router;
