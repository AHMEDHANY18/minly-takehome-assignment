import { Router } from "express";
import { requireAuth } from "../../middleware/auth/requireAuth";
import { validate } from "../../middleware/validate";
import { feedQuerySchema } from "../../validation/media/feedQuery.schema";
import { getHomeFeedController } from "../../controllers/feed/getHomeFeed.controller";
import { getTrendingFeedController } from "../../controllers/feed/getTrendingFeed.controller";
import { getExploreFeedController } from "../../controllers/feed/getExploreFeed.controller";

const router = Router();

// Home feed (following + fallback explore)
router.get("/home", requireAuth, validate(feedQuerySchema), getHomeFeedController);
router.get("/trending", requireAuth, validate(feedQuerySchema), getTrendingFeedController);
router.get("/explore", requireAuth, validate(feedQuerySchema), getExploreFeedController);

export default router;
