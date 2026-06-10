// src/features/messages/api/messages.api.ts
import { api } from "@/api/client";

export type ChatParticipant = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

export type ChatMessage = {
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

export type ConversationsPage = {
  conversations: ConversationItem[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

export const MessagesAPI = {
  /** POST /conversation — get-or-create the 1:1 conversation */
  async getOrCreate(userId: string) {
    const res = await api.post<{
      status: string;
      data: { id: string; participant: ChatParticipant };
    }>("/conversation", { userId });
    return res.data.data;
  },

  /** GET /conversation — list ordered by lastMessageAt desc */
  async listConversations(params?: { page?: number; limit?: number }) {
    const res = await api.get<{ status: string; data: ConversationsPage }>(
      "/conversation",
      { params }
    );
    return res.data.data;
  },

  /** GET /conversation/:id/messages — newest first, cursor pagination */
  async listMessages(
    conversationId: string,
    params?: { cursor?: string | null; limit?: number }
  ) {
    const res = await api.get<{
      status: string;
      data: { messages: ChatMessage[]; nextCursor: string | null };
    }>(`/conversation/${conversationId}/messages`, {
      params: {
        limit: params?.limit,
        cursor: params?.cursor ?? undefined,
      },
    });
    return res.data.data;
  },

  /** POST /conversation/:id/messages */
  async sendMessage(conversationId: string, text: string) {
    const res = await api.post<{
      status: string;
      data: { message: ChatMessage };
    }>(`/conversation/${conversationId}/messages`, { text });
    return res.data.data.message;
  },

  /** PATCH /conversation/:id/read */
  async markRead(conversationId: string) {
    const res = await api.patch<{
      status: string;
      data: { conversationId: string; readCount: number };
    }>(`/conversation/${conversationId}/read`);
    return res.data.data;
  },

  /** GET /conversation/unread-count */
  async unreadCount() {
    const res = await api.get<{ status: string; data: { count: number } }>(
      "/conversation/unread-count"
    );
    return res.data.data.count;
  },
};
