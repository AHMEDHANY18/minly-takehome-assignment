import { Router } from "express";
import { authLimiter } from "../../middleware/rateLimit";
import { checkEmail, login, register } from "../../controllers/auth.controller";
import { requireAuth } from "../../middleware/auth/requireAuth";
import { validate } from "../../middleware/validate";
import { updateProfileSchema } from "../../validation/user/updateProfileSchema";
import { updateProfileController } from "../../controllers/user.controller/updateProfile.controller";

const router = Router();
router.patch(
    "/me",
    requireAuth,
    avatarUpload,         // multer middleware
    validate(updateProfileSchema),
    updateProfileController
  );


export default router;
