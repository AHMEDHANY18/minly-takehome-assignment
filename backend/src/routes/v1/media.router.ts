import { Router } from "express";
import { requireAuth } from "../../middleware/auth/requireAuth";
import { mediaUpload } from "../../middleware/upload/mediaUpload"; // ✔️ الاسم الصحيح
import { uploadMediaController } from "../../controllers/media.controller/uploadMedia.controller";
import { getFeedController } from "../../controllers/media.controller/getFeed.controller";

const router = Router();

router.post(
  "/",
  requireAuth,
  mediaUpload,
  uploadMediaController
);

router.get(
    "/",
    getFeedController
  );
export default router;
