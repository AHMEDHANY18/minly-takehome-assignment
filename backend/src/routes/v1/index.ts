import { Router } from "express";
import authRoutes from "./auth.router";
import mediaRoutes from "./media.router";

const router = Router({ mergeParams: true });

// هنا بقى نركب /auth على نفس router
router.use("/auth", authRoutes);
router.use("/media", mediaRoutes);

export default router;
