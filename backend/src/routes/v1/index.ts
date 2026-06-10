import { Router } from "express";
import authRoutes from "./auth.router";
import mediaRoutes from "./media.router";
import userRoutes from "./user.router";
import likeRoutes from "./like.router";
import commentRoutes from "./comment.router";
import followRoutes from "./follow.router";
import bookmarkRoutes from "./bookmark.router";
import notificationRoutes from "./notification.router";
import feedRoutes from "./feed.router";
import blockRoutes from "./block.router";
import reportRoutes from "./report.router";
import conversationRoutes from "./conversation.router";
import storyRoutes from "./story.router";
import adminRoutes from "./admin.router";

const router = Router({ mergeParams: true });

// هنا بقى نركب /auth على نفس router
router.use("/auth", authRoutes);
router.use("/media", mediaRoutes);
router.use("/user", userRoutes);
router.use("/like", likeRoutes);
router.use("/comment", commentRoutes);
router.use("/follow", followRoutes);
router.use("/bookmark", bookmarkRoutes);
router.use("/notification", notificationRoutes);
router.use("/feed", feedRoutes);
router.use("/block", blockRoutes);
router.use("/report", reportRoutes);
router.use("/conversation", conversationRoutes);
router.use("/story", storyRoutes);
router.use("/admin", adminRoutes);

export default router;
