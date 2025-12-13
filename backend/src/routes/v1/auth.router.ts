import { Router } from "express";
import { cognitoCallback } from "../../controllers/auth.controller/cognito";
import { requireAuth } from "../../middleware/auth/requireAuth";
import { getMe } from "../../controllers/auth.controller/me";

const router = Router();

router.get("/callback", cognitoCallback);
router.get("/me", requireAuth, getMe);

export default router;
