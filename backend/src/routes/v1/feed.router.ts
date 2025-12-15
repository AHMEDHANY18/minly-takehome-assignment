import { Router } from "express";
import { requireAuth } from "../../middleware/auth/requireAuth";
import { getHomeFeedController } from "../../controllers/feed/getHomeFeed.controller";
import { getTrendingFeedController } from "../../controllers/feed/getTrendingFeed.controller";
import { getExploreFeedController } from "../../controllers/feed/getExploreFeed.controller";

const router = Router();

// Home feed (following + fallback explore)
router.get("/home", requireAuth, getHomeFeedController);
router.get("/trending", requireAuth, getTrendingFeedController);
router.get("/explore", requireAuth, getExploreFeedController);

export default router;
