jest.mock("../repositories/conversation.repository", () => ({
  ConversationRepository: {
    findByIdWithParticipants: jest.fn(),
    createMessage: jest.fn(),
  },
}));
jest.mock("../repositories/block.repository", () => ({
  BlockRepository: { isBlockedEitherWay: jest.fn() },
}));
jest.mock("../realtime/notification.stream", () => ({
  NotificationStream: { emit: jest.fn() },
}));

import { sendMessageService } from "../services/conversation/sendMessage.service";
import { ConversationRepository } from "../repositories/conversation.repository";
import { BlockRepository } from "../repositories/block.repository";
import { NotificationStream } from "../realtime/notification.stream";

const mockFindConversation =
  ConversationRepository.findByIdWithParticipants as jest.Mock;
const mockCreateMessage = ConversationRepository.createMessage as jest.Mock;
const mockIsBlocked = BlockRepository.isBlockedEitherWay as jest.Mock;
const mockEmit = NotificationStream.emit as jest.Mock;

const conversation = {
  id: "conv-1",
  participants: [
    { userId: "user-1", user: { id: "user-1", name: "A", avatarUrl: null } },
    { userId: "user-2", user: { id: "user-2", name: "B", avatarUrl: null } },
  ],
};

describe("sendMessageService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindConversation.mockResolvedValue(conversation);
    mockIsBlocked.mockResolvedValue(false);
  });

  it("throws 404 when conversation not found", async () => {
    mockFindConversation.mockResolvedValue(null);

    await expect(
      sendMessageService({ viewerId: "user-1", conversationId: "conv-1", text: "hi" })
    ).rejects.toMatchObject({ status: 404 });
  });

  it("throws 403 when sender is not a participant", async () => {
    await expect(
      sendMessageService({ viewerId: "user-3", conversationId: "conv-1", text: "hi" })
    ).rejects.toMatchObject({ status: 403 });

    expect(mockCreateMessage).not.toHaveBeenCalled();
  });

  it("throws 403 when either side blocked the other", async () => {
    mockIsBlocked.mockResolvedValue(true);

    await expect(
      sendMessageService({ viewerId: "user-1", conversationId: "conv-1", text: "hi" })
    ).rejects.toMatchObject({ status: 403, message: "User is blocked" });

    expect(mockCreateMessage).not.toHaveBeenCalled();
    expect(mockEmit).not.toHaveBeenCalled();
  });

  it("creates the message and emits a MESSAGE event to the other participant", async () => {
    const message = {
      id: "msg-1",
      conversationId: "conv-1",
      senderId: "user-1",
      text: "hi",
    };
    mockCreateMessage.mockResolvedValue(message);

    const result = await sendMessageService({
      viewerId: "user-1",
      conversationId: "conv-1",
      text: "  hi  ",
    });

    expect(result).toBe(message);
    expect(mockCreateMessage).toHaveBeenCalledWith({
      conversationId: "conv-1",
      senderId: "user-1",
      text: "hi",
    });
    expect(mockEmit).toHaveBeenCalledWith("user-2", {
      kind: "MESSAGE",
      conversationId: "conv-1",
      message,
    });
  });
});
