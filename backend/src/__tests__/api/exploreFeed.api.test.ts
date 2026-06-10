jest.mock("../../middleware/auth/requireAuth", () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.user = { id: "viewer-1", isAdmin: false };
    next();
  },
}));

jest.mock("../../services/feed/getExploreFeed.service", () => ({
  getExploreFeedService: jest.fn(),
}));

import request from "supertest";
import app from "../../app";
import { getExploreFeedService } from "../../services/feed/getExploreFeed.service";

const mockExplore = getExploreFeedService as jest.Mock;

describe("GET /v1/feed/explore", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns the explore feed shape", async () => {
    mockExplore.mockResolvedValue({
      items: [
        {
          id: "media-1",
          url: "https://cdn.example.com/m1.jpg",
          thumbnailUrl: null,
          type: "IMAGE",
          title: "Hello #travel",
          description: null,
          uploaderId: "user-2",
          likesCount: 3,
          commentCount: 1,
          viewsCount: 42,
          createdAt: new Date().toISOString(),
          uploader: { id: "user-2", name: "Uploader", avatarUrl: null },
          isLiked: false,
          isBookmarked: false,
        },
      ],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1, nextCursor: null },
      meta: { excludedFollowingCount: 0 },
    });

    const res = await request(app).get("/v1/feed/explore?page=1&limit=20");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0]).toMatchObject({
      id: "media-1",
      viewsCount: 42,
      isLiked: false,
      isBookmarked: false,
    });
    expect(res.body.pagination).toMatchObject({ page: 1, limit: 20, total: 1 });
    expect(mockExplore).toHaveBeenCalledWith(
      expect.objectContaining({ viewerId: "viewer-1", page: 1, limit: 20 })
    );
  });

  it("rejects an invalid limit with 400", async () => {
    const res = await request(app).get("/v1/feed/explore?limit=999");

    expect(res.status).toBe(400);
    expect(res.body.status).toBe("error");
    expect(mockExplore).not.toHaveBeenCalled();
  });
});
