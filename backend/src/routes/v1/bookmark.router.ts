import { Router } from "express";
import { requireAuth } from "../../middleware/auth/requireAuth";
import { toggleBookmarkController } from "../../controllers/bookmark.controller/bookmark.controller";

const router = Router();

router.post("/:mediaId", requireAuth, toggleBookmarkController);

export default router;
