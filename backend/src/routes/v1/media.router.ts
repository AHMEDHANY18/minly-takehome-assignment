import { Router } from "express";
import { requireAuth } from "../../middleware/auth/requireAuth";
import { mediaUpload } from "../../middleware/upload/mediaUpload"; // ✔️ الاسم الصحيح
import { uploadMediaController } from "../../controllers/media.controller/uploadMedia.controller";

const router = Router();

router.post(
  "/",
  requireAuth,
  mediaUpload,
  uploadMediaController
);

export default router;
