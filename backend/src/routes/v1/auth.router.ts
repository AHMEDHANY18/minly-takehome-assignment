import { Router } from "express";
import { authLimiter } from "../../middleware/rateLimit";
import { checkEmail, login, register } from "../../controllers/auth.controller";
import { validate } from "../../middleware/validate";
import { checkEmailSchema } from "../../validation/auth/checkEmail.schema";

const router = Router();

router.post("/check-email", authLimiter, validate(checkEmailSchema), checkEmail);
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);

export default router;
