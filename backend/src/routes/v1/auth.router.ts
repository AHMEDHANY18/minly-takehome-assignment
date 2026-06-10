import { Router } from "express";
import { requireAuth } from "../../middleware/auth/requireAuth";
import { authDevLogin, authLogout, authMe, authRefresh, cognitoCallback, cognitoLogin } from "../../controllers/auth.controller/auth.controller";


const router = Router();

router.get("/login", cognitoLogin);
router.get("/callback", cognitoCallback);

// Local development only (active when DEV_AUTH=true; otherwise responds 404)
router.post("/dev-login", authDevLogin);

router.get("/me", requireAuth, authMe);
router.post("/refresh", authRefresh);
router.get("/logout", authLogout);


export default router;
