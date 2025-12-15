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

export default router;
