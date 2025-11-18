import { Router } from "express";
import { authLimiter } from "../../middleware/rateLimit";
import { checkEmail, login, register } from "../../controllers/auth.controller";

const router = Router();
router.post("/check-email", authLimiter, checkEmail);
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);


export default router;
