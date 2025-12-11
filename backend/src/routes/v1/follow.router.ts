// src/routes/follow.routes.ts
import { Router } from "express";
import { requireAuth } from "../../middleware/auth/requireAuth";
import { toggleFollowController } from "../../controllers/follow.controller/follow.controller";

const router = Router();

router.post("/:id", requireAuth, toggleFollowController);

export default router;
