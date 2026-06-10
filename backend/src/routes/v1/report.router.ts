import { Router } from "express";
import { requireAuth } from "../../middleware/auth/requireAuth";
import { validate } from "../../middleware/validate";
import { createReportSchema } from "../../validation/report/createReport.schema";
import { createReportController } from "../../controllers/report.controller/createReport.controller";
import { listMyReportsController } from "../../controllers/report.controller/listMyReports.controller";

const router = Router();

router.post("/", requireAuth, validate(createReportSchema), createReportController);
router.get("/mine", requireAuth, listMyReportsController);

export default router;
