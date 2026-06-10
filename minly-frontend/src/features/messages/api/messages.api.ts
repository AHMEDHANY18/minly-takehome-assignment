import { api } from "@/shared/api/http";

export type ChatParticipant = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

export type MessageItem = {
  id: string;
  conversationId: string;
  senderId: string;
  text: string | null;
  mediaUrl: string | null;
  isRead: boolean;
  createdAt: string;
};

export type ConversationLastMessage = {
  id: string;
  text: string | null;
  mediaUrl: string | null;
  senderId: string;
  createdAt: string;
};

export type ConversationItem = {
  id: string;
  participant: ChatParticipant;
  lastMessage: ConversationLastMessage | null;
  unreadCount: number;
  lastMessageAt: string | null;
};

export type ConversationsData = {
  conversations: ConversationItem[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

type Envelope<T> = { status: "success"; data: T };

export const MessagesAPI = {
  /** get-or-create the 1:1 conversation with userId */
  getOrCreate(userId: string) {
    return api.post<Envelope<{ id: string; participant: ChatParticipant }>>(
      "/conversation",
      { userId }
    );
  },

  list(page = 1, limit = 20) {
    return api.get<Envelope<ConversationsData>>("/conversation", {
      params: { page, limit },
    });
  },

  messages(
    conversationId: string,
    params?: { cursor?: string | null; limit?: number }
  ) {
    return api.get<
      Envelope<{ messages: MessageItem[]; nextCursor: string | null }>
    >(`/conversation/${conversationId}/messages`, {
      params: {
        limit: params?.limit,
        cursor: params?.cursor ?? undefined,
      },
    });
  },

  send(conversationId: string, text: string) {
    return api.post<Envelope<{ message: MessageItem }>>(
      `/conversation/${conversationId}/messages`,
      { text }
    );
  },

  markRead(conversationId: string) {
    return api.patch<Envelope<{ conversationId: string; readCount: number }>>(
      `/conversation/${conversationId}/read`
    );
  },

  unreadCount() {
    return api.get<Envelope<{ count: number }>>("/conversation/unread-count");
  },
};
