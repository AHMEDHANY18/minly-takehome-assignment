import { Router } from "express";
import authRoutes from "./auth.router";
import mediaRoutes from "./media.router";
import userRoutes from "./user.router.ts";

const router = Router({ mergeParams: true });

// هنا بقى نركب /auth على نفس router
router.use("/auth", authRoutes);
router.use("/media", mediaRoutes);
router.use("/user", mediaRoutes);

export default router;
