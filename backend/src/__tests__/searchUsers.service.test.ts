jest.mock("../repositories/user.repository", () => ({
  UserRepository: { searchUsers: jest.fn() },
}));
jest.mock("../repositories/block.repository", () => ({
  BlockRepository: { getRelatedBlockedIds: jest.fn() },
}));
jest.mock("../repositories/feed.repository", () => ({
  FeedRepository: { getFollowingIds: jest.fn() },
}));

import { searchUsersService } from "../services/user/searchUsers.service";
import { UserRepository } from "../repositories/user.repository";
import { BlockRepository } from "../repositories/block.repository";
import { FeedRepository } from "../repositories/feed.repository";

const mockSearchUsers = UserRepository.searchUsers as jest.Mock;
const mockBlockedIds = BlockRepository.getRelatedBlockedIds as jest.Mock;
const mockFollowingIds = FeedRepository.getFollowingIds as jest.Mock;

describe("searchUsersService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBlockedIds.mockResolvedValue(["blocked-1"]);
    mockFollowingIds.mockResolvedValue(["user-2"]);
  });

  it("excludes the viewer and block-related users from the query", async () => {
    mockSearchUsers.mockResolvedValue([[], 0]);

    await searchUsersService({ viewerId: "me", q: "jo", page: 1, limit: 10 });

    expect(mockSearchUsers).toHaveBeenCalledWith({
      q: "jo",
      excludeIds: ["me", "blocked-1"],
      skip: 0,
      take: 10,
    });
  });

  it("maps isFollowing per user and computes hasMore", async () => {
    mockSearchUsers.mockResolvedValue([
      [
        { id: "user-2", name: "B", email: "b@x.com", avatarUrl: null, followerCount: 3 },
        { id: "user-3", name: "C", email: "c@x.com", avatarUrl: null, followerCount: 1 },
      ],
      5,
    ]);

    const result = await searchUsersService({
      viewerId: "me",
      q: "x",
      page: 1,
      limit: 2,
    });

    expect(result.users).toEqual([
      expect.objectContaining({ id: "user-2", isFollowing: true }),
      expect.objectContaining({ id: "user-3", isFollowing: false }),
    ]);
    expect(result.total).toBe(5);
    expect(result.hasMore).toBe(true);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(2);
  });

  it("paginates with skip and reports hasMore=false on the last page", async () => {
    mockSearchUsers.mockResolvedValue([
      [{ id: "user-9", name: "Z", email: "z@x.com", avatarUrl: null, followerCount: 0 }],
      3,
    ]);

    const result = await searchUsersService({
      viewerId: "me",
      q: "z",
      page: 2,
      limit: 2,
    });

    expect(mockSearchUsers).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 2, take: 2 })
    );
    expect(result.hasMore).toBe(false);
  });
});
