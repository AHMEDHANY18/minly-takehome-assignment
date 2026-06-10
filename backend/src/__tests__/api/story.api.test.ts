jest.mock("../../middleware/auth/requireAuth", () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.user = { id: "user-1", isAdmin: false };
    next();
  },
}));

jest.mock("../../services/story/createStory.service", () => ({
  createStoryService: jest.fn(),
}));

import request from "supertest";
import app from "../../app";
import { createStoryService } from "../../services/story/createStory.service";

const mockCreateStory = createStoryService as jest.Mock;

describe("POST /v1/story", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 400 when url is missing", async () => {
    const res = await request(app).post("/v1/story").send({ type: "IMAGE" });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe("error");
    expect(mockCreateStory).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid type", async () => {
    const res = await request(app)
      .post("/v1/story")
      .send({ url: "https://cdn.example.com/s1.jpg", type: "GIF" });

    expect(res.status).toBe(400);
    expect(mockCreateStory).not.toHaveBeenCalled();
  });

  it("returns 400 when url is not a valid URL", async () => {
    const res = await request(app)
      .post("/v1/story")
      .send({ url: "not-a-url", type: "IMAGE" });

    expect(res.status).toBe(400);
    expect(mockCreateStory).not.toHaveBeenCalled();
  });

  it("creates a story (201)", async () => {
    const story = {
      id: "story-1",
      userId: "user-1",
      url: "https://cdn.example.com/s1.jpg",
      type: "IMAGE",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    };
    mockCreateStory.mockResolvedValue({ story });

    const res = await request(app)
      .post("/v1/story")
      .send({ url: "https://cdn.example.com/s1.jpg", type: "IMAGE" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ status: "success", data: { story } });
    expect(mockCreateStory).toHaveBeenCalledWith({
      userId: "user-1",
      url: "https://cdn.example.com/s1.jpg",
      type: "IMAGE",
    });
  });
});
