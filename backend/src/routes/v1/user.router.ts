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

// ƒo. O"OñU^U?OUSU, "OœU+O"
router.get("/me", requireAuth, getMyProfileController);

// ƒo. O¦O-O_USO® OU,O"OñU^U?OUSU, (OU,U,US O1U.U,U+OUØ U,O"U, UŸO_UØ)
router.patch(
  "/",
  requireAuth,
  uploadImage, // Restrict avatar uploads to images
  validate(updateProfileSchema),
  updateProfileController
);

// ƒo. O"OñU^U?OUSU, OœUS O-O_ O"OU,U? id
router.get("/:id", validate(getUserProfileByIdSchema), getUserProfileByIdController);

export default router;
