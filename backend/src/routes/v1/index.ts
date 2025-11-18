import { Router } from "express";
import authRoutes from "./auth.router";

const router = Router({ mergeParams: true });

// هنا بقى نركب /auth على نفس router
router.use("/auth", authRoutes);

export default router;
