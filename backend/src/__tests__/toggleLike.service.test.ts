jest.mock("../repositories/user.repository", () => ({
  UserRepository: { findById: jest.fn() },
}));
jest.mock("../repositories/media.repository", () => ({
  MediaRepository: { findById: jest.fn() },
}));
jest.mock("../repositories/like.repository", () => ({
  LikeRepository: {
    findByUserAndMedia: jest.fn(),
    createLikeWithCounters: jest.fn(),
    deleteLikeWithCounters: jest.fn(),
  },
}));
jest.mock("../repositories/notification.repository", () => ({
  NotificationRepository: { create: jest.fn() },
}));

import { toggleLikeService } from "../services/like/toggleLike.service";
import { UserRepository } from "../repositories/user.repository";
import { MediaRepository } from "../repositories/media.repository";
import { LikeRepository } from "../repositories/like.repository";
import { NotificationRepository } from "../repositories/notification.repository";

const mockFindUser = UserRepository.findById as jest.Mock;
const mockFindMedia = MediaRepository.findById as jest.Mock;
const mockFindLike = LikeRepository.findByUserAndMedia as jest.Mock;
const mockCreateLike = LikeRepository.createLikeWithCounters as jest.Mock;
const mockDeleteLike = LikeRepository.deleteLikeWithCounters as jest.Mock;
const mockCreateNotification = NotificationRepository.create as jest.Mock;

describe("toggleLikeService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindUser.mockResolvedValue({ id: "user-1" });
    mockFindMedia.mockResolvedValue({ id: "media-1", uploaderId: "owner-1" });
  });

  it("throws 401 when userId is missing", async () => {
    await expect(toggleLikeService("media-1", "")).rejects.toMatchObject({
      status: 401,
    });
  });

  it("throws 404 when media not found", async () => {
    mockFindMedia.mockResolvedValue(null);

    await expect(toggleLikeService("media-1", "user-1")).rejects.toMatchObject({
      status: 404,
    });
  });

  it("likes and notifies the owner when not previously liked", async () => {
    mockFindLike.mockResolvedValue(null);
    mockCreateLike.mockResolvedValue({ updatedLikesCount: 5 });

    const result = await toggleLikeService("media-1", "user-1");

    expect(result).toEqual({ mediaId: "media-1", isLiked: true, likesCount: 5 });
    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "LIKE",
        actorId: "user-1",
        targetUserId: "owner-1",
      })
    );
  });

  it("does not notify when liking own media", async () => {
    mockFindMedia.mockResolvedValue({ id: "media-1", uploaderId: "user-1" });
    mockFindLike.mockResolvedValue(null);
    mockCreateLike.mockResolvedValue({ updatedLikesCount: 1 });

    const result = await toggleLikeService("media-1", "user-1");

    expect(result.isLiked).toBe(true);
    expect(mockCreateNotification).not.toHaveBeenCalled();
  });

  it("unlikes when already liked (no notification)", async () => {
    mockFindLike.mockResolvedValue({ id: "like-1" });
    mockDeleteLike.mockResolvedValue({ updatedLikesCount: 4 });

    const result = await toggleLikeService("media-1", "user-1");

    expect(result).toEqual({
      mediaId: "media-1",
      isLiked: false,
      likesCount: 4,
    });
    expect(mockDeleteLike).toHaveBeenCalledWith(
      expect.objectContaining({ likeId: "like-1" })
    );
    expect(mockCreateNotification).not.toHaveBeenCalled();
  });
});
