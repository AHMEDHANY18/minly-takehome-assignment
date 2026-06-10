jest.mock("../repositories/comment.repository", () => ({
  CommentRepository: {
    findCommentById: jest.fn(),
    updateCommentText: jest.fn(),
  },
}));

import { editCommentService } from "../services/comment/editComment.service";
import { CommentRepository } from "../repositories/comment.repository";

const mockFindComment = CommentRepository.findCommentById as jest.Mock;
const mockUpdateComment = CommentRepository.updateCommentText as jest.Mock;

describe("editCommentService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws 404 when comment not found", async () => {
    mockFindComment.mockResolvedValue(null);

    await expect(
      editCommentService("comment-1", "user-1", "new text")
    ).rejects.toMatchObject({ status: 404 });
  });

  it("throws 403 when caller is not the owner", async () => {
    mockFindComment.mockResolvedValue({ id: "comment-1", userId: "user-2" });

    await expect(
      editCommentService("comment-1", "user-1", "new text")
    ).rejects.toMatchObject({ status: 403 });

    expect(mockUpdateComment).not.toHaveBeenCalled();
  });

  it("updates the text and returns isEdited", async () => {
    const updatedAt = new Date();
    mockFindComment.mockResolvedValue({ id: "comment-1", userId: "user-1" });
    mockUpdateComment.mockResolvedValue({
      id: "comment-1",
      text: "new text",
      isEdited: true,
      updatedAt,
    });

    const result = await editCommentService("comment-1", "user-1", "  new text  ");

    expect(mockUpdateComment).toHaveBeenCalledWith("comment-1", "new text");
    expect(result).toEqual({
      id: "comment-1",
      text: "new text",
      isEdited: true,
      updatedAt,
    });
  });
});
