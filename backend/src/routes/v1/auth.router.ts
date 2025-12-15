import { Router } from "express";
import { authLogout, authMe, authRefresh, cognitoCallback, cognitoLogin } from "../../controllers/auth.controller/cognito";
import { requireAuth } from "../../middleware/auth/requireAuth";


const router = Router();

router.get("/login", cognitoLogin);
router.get("/callback", cognitoCallback);

router.get("/me", requireAuth, authMe);
router.post("/refresh", authRefresh);
router.get("/logout", authLogout);


export default router;
