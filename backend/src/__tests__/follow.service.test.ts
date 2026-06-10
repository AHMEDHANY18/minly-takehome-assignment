jest.mock("../repositories/follow.repository", () => ({
  FollowerRepository: {
    findFollowRelation: jest.fn(),
    createFollow: jest.fn(),
    deleteFollow: jest.fn(),
    incrementCounters: jest.fn(),
    decrementCounters: jest.fn(),
  },
}));
jest.mock("../repositories/user.repository", () => ({
  UserRepository: { findById: jest.fn() },
}));
jest.mock("../repositories/notification.repository", () => ({
  NotificationRepository: { create: jest.fn() },
}));

import { toggleFollowService } from "../services/follow/follow.service";
import { FollowerRepository } from "../repositories/follow.repository";
import { UserRepository } from "../repositories/user.repository";
import { NotificationRepository } from "../repositories/notification.repository";

const mockFindUser = UserRepository.findById as jest.Mock;
const mockFindRelation = FollowerRepository.findFollowRelation as jest.Mock;
const mockCreateFollow = FollowerRepository.createFollow as jest.Mock;
const mockDeleteFollow = FollowerRepository.deleteFollow as jest.Mock;
const mockIncrement = FollowerRepository.incrementCounters as jest.Mock;
const mockDecrement = FollowerRepository.decrementCounters as jest.Mock;
const mockCreateNotification = NotificationRepository.create as jest.Mock;

describe("toggleFollowService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindUser.mockResolvedValue({ id: "user-2" });
  });

  it("throws 400 when following yourself", async () => {
    await expect(toggleFollowService("user-1", "user-1")).rejects.toMatchObject(
      { status: 400 }
    );
  });

  it("throws 404 when target user not found", async () => {
    mockFindUser.mockResolvedValue(null);

    await expect(toggleFollowService("user-1", "user-2")).rejects.toMatchObject(
      { status: 404 }
    );
  });

  it("follows, increments counters and notifies", async () => {
    mockFindRelation.mockResolvedValue(null);
    mockCreateFollow.mockResolvedValue({ id: "follow-1" });

    const result = await toggleFollowService("user-1", "user-2");

    expect(result.isFollowing).toBe(true);
    expect(mockIncrement).toHaveBeenCalledWith("user-1", "user-2");
    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "FOLLOW",
        actorId: "user-1",
        targetUserId: "user-2",
        followId: "follow-1",
      })
    );
  });

  it("unfollows and decrements counters without notification", async () => {
    mockFindRelation.mockResolvedValue({ id: "follow-1" });

    const result = await toggleFollowService("user-1", "user-2");

    expect(result.isFollowing).toBe(false);
    expect(mockDeleteFollow).toHaveBeenCalledWith("user-1", "user-2");
    expect(mockDecrement).toHaveBeenCalledWith("user-1", "user-2");
    expect(mockCreateNotification).not.toHaveBeenCalled();
  });
});
