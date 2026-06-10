import { Router } from "express";
import { requireAuth } from "../../middleware/auth/requireAuth";
import { requireAdmin } from "../../middleware/auth/requireAdmin";
import { validate } from "../../middleware/validate";
import { listReportsQuerySchema } from "../../validation/admin/listReportsQuery.schema";
import { updateReportStatusSchema } from "../../validation/admin/updateReportStatus.schema";
import { getStatsController } from "../../controllers/admin.controller/getStats.controller";
import { listReportsController } from "../../controllers/admin.controller/listReports.controller";
import { updateReportStatusController } from "../../controllers/admin.controller/updateReportStatus.controller";
import { deleteMediaAdminController } from "../../controllers/admin.controller/deleteMediaAdmin.controller";
import { deleteCommentAdminController } from "../../controllers/admin.controller/deleteCommentAdmin.controller";
import { getMetricsController } from "../../controllers/admin.controller/getMetrics.controller";

const router = Router();

// every admin route requires auth + admin
router.use(requireAuth, requireAdmin);

router.get("/stats", getStatsController);
router.get("/metrics", getMetricsController);

router.get("/reports", validate(listReportsQuerySchema), listReportsController);
router.patch(
  "/reports/:id",
  validate(updateReportStatusSchema),
  updateReportStatusController
);

router.delete("/media/:id", deleteMediaAdminController);
router.delete("/comment/:id", deleteCommentAdminController);

export default router;
