import { Router } from "express";
import { requireAuth } from "../../middleware/auth/requireAuth";
import { validate } from "../../middleware/validate";
import { updateProfileSchema } from "../../validation/user/updateProfileSchema";
import { updateProfileController } from "../../controllers/user.controller/updateProfile.controller";
import { getMyProfileController } from "../../controllers/user.controller/getMyProfile.controller";
import { getUserProfileByIdController } from "../../controllers/user.controller/getUserProfileById.controller";
import { getUserProfileByIdSchema } from "../../validation/user/getUserProfileByIdSchema";
import { uploadImage } from "../../middleware/upload/imageUpload";

const router = Router();

router.get("/me", requireAuth, getMyProfileController);

router.patch(
  "/",
  requireAuth,
  uploadImage,
  validate(updateProfileSchema),
  updateProfileController
);

router.get("/:id", validate(getUserProfileByIdSchema), getUserProfileByIdController);

export default router;
