import { Router } from "express";
import { checkEmail, login ,register} from "../../controllers/auth.controller.ts";

const router = Router();

router.post("/check-email", checkEmail);
router.post("/register", register);
router.post("/login", login);

export default router;
