import { Router } from "express";
import { requireAuth } from "../../middleware/auth/requireAuth";
import { validate } from "../../middleware/validate";
import { createConversationSchema } from "../../validation/conversation/createConversation.schema";
import { sendMessageSchema } from "../../validation/conversation/sendMessage.schema";
import { getOrCreateConversationController } from "../../controllers/conversation.controller/getOrCreateConversation.controller";
import { listConversationsController } from "../../controllers/conversation.controller/listConversations.controller";
import { getMessagesController } from "../../controllers/conversation.controller/getMessages.controller";
import { sendMessageController } from "../../controllers/conversation.controller/sendMessage.controller";
import { markConversationReadController } from "../../controllers/conversation.controller/markConversationRead.controller";
import { unreadMessagesCountController } from "../../controllers/conversation.controller/unreadMessagesCount.controller";

const router = Router();

// ✅ static first — must come before parameterized "/:id" routes
router.get("/unread-count", requireAuth, unreadMessagesCountController);

router.post(
  "/",
  requireAuth,
  validate(createConversationSchema),
  getOrCreateConversationController
);
router.get("/", requireAuth, listConversationsController);

router.get("/:id/messages", requireAuth, getMessagesController);
router.post(
  "/:id/messages",
  requireAuth,
  validate(sendMessageSchema),
  sendMessageController
);
router.patch("/:id/read", requireAuth, markConversationReadController);

export default router;
