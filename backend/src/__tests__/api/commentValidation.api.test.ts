jest.mock("../../middleware/auth/requireAuth", () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.user = { id: "user-1", isAdmin: false };
    next();
  },
}));

jest.mock("../../services/comment/editComment.service", () => ({
  editCommentService: jest.fn(),
}));

import request from "supertest";
import app from "../../app";
import { editCommentService } from "../../services/comment/editComment.service";

const mockEdit = editCommentService as jest.Mock;

const COMMENT_ID = "1f2c3a44-5b66-4777-8888-99aabbccddee";

describe("PATCH /v1/comment/:commentId validation", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 400 for an empty text", async () => {
    const res = await request(app)
      .patch(`/v1/comment/${COMMENT_ID}`)
      .send({ text: "" });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe("error");
    expect(mockEdit).not.toHaveBeenCalled();
  });

  it("returns 400 for a non-uuid comment id", async () => {
    const res = await request(app)
      .patch("/v1/comment/not-a-uuid")
      .send({ text: "valid text" });

    expect(res.status).toBe(400);
    expect(mockEdit).not.toHaveBeenCalled();
  });
});
