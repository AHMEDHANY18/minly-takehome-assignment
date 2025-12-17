import { Router } from "express";
import { requireAuth } from "../../middleware/auth/requireAuth";
import { toggleBookmarkController } from "../../controllers/bookmark.controller/bookmark.controller";
import { getBookmarksController } from "../../controllers/bookmark.controller/find-all-bookmark.controller";

const router = Router();

router.post("/:mediaId", requireAuth, toggleBookmarkController);
router.get("/", requireAuth, getBookmarksController);

export default router;
