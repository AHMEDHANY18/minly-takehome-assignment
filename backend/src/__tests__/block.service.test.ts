jest.mock("../repositories/block.repository", () => ({
  BlockRepository: {
    findBlock: jest.fn(),
    createBlockWithCleanup: jest.fn(),
    deleteBlock: jest.fn(),
  },
}));
jest.mock("../repositories/user.repository", () => ({
  UserRepository: { findById: jest.fn() },
}));

import { toggleBlockService } from "../services/block/toggleBlock.service";
import { BlockRepository } from "../repositories/block.repository";
import { UserRepository } from "../repositories/user.repository";

const mockFindUser = UserRepository.findById as jest.Mock;
const mockFindBlock = BlockRepository.findBlock as jest.Mock;
const mockCreateBlock = BlockRepository.createBlockWithCleanup as jest.Mock;
const mockDeleteBlock = BlockRepository.deleteBlock as jest.Mock;

describe("toggleBlockService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindUser.mockResolvedValue({ id: "user-2" });
  });

  it("throws 400 when blocking yourself", async () => {
    await expect(toggleBlockService("user-1", "user-1")).rejects.toMatchObject({
      status: 400,
    });
  });

  it("throws 404 when target user not found", async () => {
    mockFindUser.mockResolvedValue(null);

    await expect(toggleBlockService("user-1", "user-2")).rejects.toMatchObject({
      status: 404,
    });
  });

  it("blocks (with follow cleanup) when not blocked yet", async () => {
    mockFindBlock.mockResolvedValue(null);

    const result = await toggleBlockService("user-1", "user-2");

    expect(result).toEqual({ userId: "user-2", isBlocked: true });
    expect(mockCreateBlock).toHaveBeenCalledWith("user-1", "user-2");
    expect(mockDeleteBlock).not.toHaveBeenCalled();
  });

  it("unblocks when already blocked", async () => {
    mockFindBlock.mockResolvedValue({ id: "block-1" });

    const result = await toggleBlockService("user-1", "user-2");

    expect(result).toEqual({ userId: "user-2", isBlocked: false });
    expect(mockDeleteBlock).toHaveBeenCalledWith("block-1");
    expect(mockCreateBlock).not.toHaveBeenCalled();
  });
});
