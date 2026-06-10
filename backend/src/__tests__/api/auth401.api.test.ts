// Real requireAuth path — no token / cookie → 401 before any DB access.
import request from "supertest";
import app from "../../app";

describe("auth — 401 without token", () => {
  it("rejects GET /v1/feed/explore", async () => {
    const res = await request(app).get("/v1/feed/explore");

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ code: "NO_TOKEN" });
  });

  it("rejects GET /v1/admin/stats", async () => {
    const res = await request(app).get("/v1/admin/stats");

    expect(res.status).toBe(401);
  });

  it("rejects POST /v1/story", async () => {
    const res = await request(app)
      .post("/v1/story")
      .send({ url: "https://example.com/a.jpg", type: "IMAGE" });

    expect(res.status).toBe(401);
  });
});
