import { Router } from "express";
import { requireAuth } from "../../middleware/auth/requireAuth";
import { validate } from "../../middleware/validate";
import { createStorySchema } from "../../validation/story/createStory.schema";
import { createStoryController } from "../../controllers/story.controller/createStory.controller";
import { getStoryFeedController } from "../../controllers/story.controller/getStoryFeed.controller";
import { viewStoryController } from "../../controllers/story.controller/viewStory.controller";
import { getStoryViewersController } from "../../controllers/story.controller/getStoryViewers.controller";
import { deleteStoryController } from "../../controllers/story.controller/deleteStory.controller";

const router = Router();

// ✅ static first
router.post("/", requireAuth, validate(createStorySchema), createStoryController);
router.get("/feed", requireAuth, getStoryFeedController);

router.post("/:id/view", requireAuth, viewStoryController);
router.get("/:id/viewers", requireAuth, getStoryViewersController);
router.delete("/:id", requireAuth, deleteStoryController);

export default router;
