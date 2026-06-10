import { Router } from "express";
import { requireAuth } from "../../middleware/auth/requireAuth";
import { toggleBlockController } from "../../controllers/block.controller/toggleBlock.controller";
import { listBlockedController } from "../../controllers/block.controller/listBlocked.controller";

const router = Router();

router.get("/", requireAuth, listBlockedController);
router.post("/:userId", requireAuth, toggleBlockController);

export default router;
