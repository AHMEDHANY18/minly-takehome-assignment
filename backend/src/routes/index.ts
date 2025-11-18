import { Router } from "express";
import V1Router from "./v1";

const router = Router({ mergeParams: true });


// API routes
router.use("/v1", V1Router);

export default router;