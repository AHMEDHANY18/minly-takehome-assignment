import { Router } from "express";
import { authLimiter } from "../../middleware/rateLimit";
import {  login, register } from "../../controllers/auth.controller";
import { validate } from "../../middleware/validate";

const router = Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);

export default router;
