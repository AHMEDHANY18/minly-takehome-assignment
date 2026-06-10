import { Router } from "express";
import { requireAuth } from "../../middleware/auth/requireAuth";
import { validate } from "../../middleware/validate";
import { deleteMediaController } from "../../controllers/media.controller/deleteMedia.controller";
import { updateMediaSchema } from "../../validation/media/updateMedia.schema";
import { updateMediaController } from "../../controllers/media.controller/updateMedia.controller";
import { deleteMediaSchema } from "../../validation/media/deleteMedia.schema";
import { presignMediaUploadController } from "../../controllers/media.controller/presignMedia.controller";
import { getMediaDetailsController } from "../../controllers/media.controller/getMediaDetails.controller";
import { finalizeUploadController } from "../../controllers/media.controller/finalizeMedia.controller";
import { presignSchema } from "../../validation/media/avatar.schema";
import { finalizeMediaSchema } from "../../validation/media/finalizeMedia.schema";
import { searchMediaController } from "../../controllers/media.controller/searchMedia.controller";
import { searchQuerySchema } from "../../validation/search/searchQuery.schema";
import { getHashtagFeedController } from "../../controllers/media.controller/getHashtagFeed.controller";

const router = Router();

// ✅ static first
router.post("/presign", requireAuth, validate(presignSchema), presignMediaUploadController);
router.post("/finalize", requireAuth, validate(finalizeMediaSchema), finalizeUploadController);

router.get("/search", requireAuth, validate(searchQuerySchema), searchMediaController);
router.get("/hashtag/:tag", requireAuth, getHashtagFeedController);

router.get(
  "/:mediaId/details",
  requireAuth,
  getMediaDetailsController
);

router.patch("/:id", requireAuth, validate(updateMediaSchema), updateMediaController);
router.delete("/:id", requireAuth, validate(deleteMediaSchema), deleteMediaController);

export default router;
