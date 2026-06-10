// requireAuth is mocked to inject a configurable user; requireAdmin stays REAL
// so the 403 / 200 split exercises the actual middleware.
const mockAuthState: { user: { id: string; isAdmin: boolean } } = {
  user: { id: "user-1", isAdmin: false },
};

jest.mock("../../middleware/auth/requireAuth", () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.user = mockAuthState.user;
    next();
  },
}));

jest.mock("../../services/admin/getAdminStats.service", () => ({
  getAdminStatsService: jest.fn(),
}));

import request from "supertest";
import app from "../../app";
import { getAdminStatsService } from "../../services/admin/getAdminStats.service";

const mockStats = getAdminStatsService as jest.Mock;

describe("GET /v1/admin/stats", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState.user = { id: "user-1", isAdmin: false };
  });

  it("returns 403 for a non-admin user", async () => {
    const res = await request(app).get("/v1/admin/stats");

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ status: "error", message: "Admin only" });
    expect(mockStats).not.toHaveBeenCalled();
  });

  it("returns 200 with stats for an admin user", async () => {
    mockAuthState.user = { id: "admin-1", isAdmin: true };

    const stats = {
      users: 21,
      media: 40,
      comments: 120,
      likes: 200,
      reports: { total: 3, pending: 3 },
      conversations: 2,
      activeStories: 7,
    };
    mockStats.mockResolvedValue(stats);

    const res = await request(app).get("/v1/admin/stats");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "success", data: stats });
  });

  it("guards /v1/admin/metrics the same way", async () => {
    const forbidden = await request(app).get("/v1/admin/metrics");
    expect(forbidden.status).toBe(403);

    mockAuthState.user = { id: "admin-1", isAdmin: true };
    const ok = await request(app).get("/v1/admin/metrics");

    expect(ok.status).toBe(200);
    expect(ok.body.data).toMatchObject({
      uptimeSeconds: expect.any(Number),
      memory: { rss: expect.any(Number), heapUsed: expect.any(Number) },
      requests: expect.objectContaining({
        total: expect.any(Number),
        errors5xx: expect.any(Number),
        byRoute: expect.any(Array),
      }),
    });
  });
});
