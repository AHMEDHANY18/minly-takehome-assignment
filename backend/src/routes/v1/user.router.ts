import { Router } from "express";
import { authLimiter } from "../..//middleware/rateLimit";
import { checkEmail, login, register } from "../../controllers/auth.controller";
import { requireAuth } from "../../middleware/auth/requireAuth";
import { validate } from "../../middleware/validate";
import { updateProfileSchema } from "../../validation/user/updateProfileSchema";
import { updateProfileController } from "../../controllers/user.controller/updateProfile.controller";
import { getMyProfileController } from "../../controllers/user.controller/getMyProfile.controller";
import { getUserProfileByIdController } from "../../controllers/user.controller/getUserProfileById.controller";
import { getUserProfileByIdSchema } from "../../validation/user/getUserProfileByIdSchema";
import { mediaUpload } from "../../middleware/upload/mediaUpload";

const router = Router();

// ✅ بروفايل "أنا"
router.get("/me", requireAuth, getMyProfileController);

// ✅ تحديث البروفايل (اللي عملناه قبل كده)
router.patch(
  "/me",
  requireAuth,
  mediaUpload, // لو مستخدمه
  validate(updateProfileSchema),
  updateProfileController
);

// ✅ بروفايل أي حد بالـ id
router.get(
  "/:id",
  validate(getUserProfileByIdSchema),
  getUserProfileByIdController
);

export default router;
