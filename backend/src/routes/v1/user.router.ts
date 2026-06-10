import { Router } from "express";
import { requireAuth } from "../../middleware/auth/requireAuth";
import { validate } from "../../middleware/validate";
import { updateProfileSchema } from "../../validation/user/updateProfileSchema";
import { updateProfileController } from "../../controllers/user.controller/updateProfile.controller";
import { getMyProfileController } from "../../controllers/user.controller/getMyProfile.controller";
import { getUserProfileByIdController } from "../../controllers/user.controller/getUserProfileById.controller";
import { getUserProfileByIdSchema } from "../../validation/user/getUserProfileByIdSchema";
import { getSuggestedUsersController } from "../../controllers/user.controller/getSuggestedUsers.controller";
import { getUserProfileController } from "../../controllers/user.controller/getUserProfile.controller";
import { searchUsersController } from "../../controllers/user.controller/searchUsers.controller";
import { searchQuerySchema } from "../../validation/search/searchQuery.schema";
import { getUserMediaController } from "../../controllers/media.controller/getUserMedia.controller";

const router = Router();

// ✅ static first
router.get("/search", requireAuth, validate(searchQuerySchema), searchUsersController);
router.get("/suggested", requireAuth, getSuggestedUsersController);
router.get("/me", requireAuth, getMyProfileController);

router.patch(
  "/",
  requireAuth,
  validate(updateProfileSchema),
  updateProfileController
);

router.get("/profile/:userId", requireAuth, getUserProfileController);
router.get("/profile", requireAuth, getUserProfileController);

router.get("/:userId/media", requireAuth, getUserMediaController);

router.get(
  "/:id",
  requireAuth,
  validate(getUserProfileByIdSchema),
  getUserProfileByIdController
);

export default router;
