import { Router } from "express";
import V1Router from "./v1";

const router = Router({ mergeParams: true });


router.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV,
    });
  });


router.use("/v1", V1Router);

export default router;