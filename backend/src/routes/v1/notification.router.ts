import { Router } from "express";
import { requireAuth } from "../../middleware/auth/requireAuth";
import { listNotificationsController } from "../../controllers/notification.controller/list-notifications.controller";
import { notificationStreamController } from "../../controllers/notification.controller/notification.controller";
import { unreadCountController } from "../../controllers/notification.controller/unreadCount.controller";
import { markNotificationReadController } from "../../controllers/notification.controller/markNotificationRead.controller";
import { markAllNotificationsReadController } from "../../controllers/notification.controller/markAllNotificationsRead.controller";


const router = Router();

router.get("/", requireAuth, listNotificationsController);
router.get("/stream", requireAuth, notificationStreamController);
router.get("/unread-count", requireAuth, unreadCountController);

router.patch("/:id/read", requireAuth, markNotificationReadController);
router.patch("/read-all", requireAuth, markAllNotificationsReadController);

export default router;
