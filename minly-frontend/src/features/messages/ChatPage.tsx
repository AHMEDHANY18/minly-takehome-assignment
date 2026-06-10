import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useUserStore } from "@/shared/store/user.store";
import {
  MessagesAPI,
  type ChatParticipant,
  type MessageItem,
} from "@/features/messages/api/messages.api";
import { useChat } from "@/features/messages/hooks/useChat";
import { Avatar, formatRelative } from "@/features/messages/ConversationsPage";

export default function ChatPage() {
  const nav = useNavigate();
  const { conversationId } = useParams();
  const location = useLocation();
  const me = useUserStore((s) => s.user);

  const stateParticipant =
    (location.state as { participant?: ChatParticipant } | null)?.participant ??
    null;

  const [participant, setParticipant] = useState<ChatParticipant | null>(
    stateParticipant
  );

  const {
    messages,
    hasOlder,
    initialLoading,
    loadingOlder,
    sending,
    error,
    setError,
    loadOlder,
    send,
  } = useChat(conversationId, 30);

  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const lastMessageId = messages.length
    ? messages[messages.length - 1].id
    : null;

  // resolve participant when navigated directly (no router state)
  useEffect(() => {
    if (participant || !conversationId) return;
    let alive = true;

    MessagesAPI.list(1, 50)
      .then((res) => {
        if (!alive) return;
        const conv = res.data.data.conversations.find(
          (c) => c.id === conversationId
        );
        if (conv) setParticipant(conv.participant);
      })
      .catch(() => {
        // header falls back to a generic title
      });

    return () => {
      alive = false;
    };
  }, [participant, conversationId]);

  // keep newest message visible
  useEffect(() => {
    if (!lastMessageId) return;
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [lastMessageId]);

  const onSend = async () => {
    if (!me || sending) return;
    const value = text;
    setText("");
    const ok = await send(value, me.id);
    if (!ok) setText(value);
  };

  return (
    <div className="mx-auto max-w-[720px]">
      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/70 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col h-[78vh]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <button
            onClick={() => nav("/messages")}
            className="h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition grid place-items-center text-gray-700 dark:text-gray-200"
            aria-label="Back to messages"
          >
            ←
          </button>

          {participant ? (
            <button
              onClick={() => nav(`/profile/${participant.id}`)}
              className="flex items-center gap-3 min-w-0"
            >
              <Avatar name={participant.name} src={participant.avatarUrl} size={36} />
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {participant.name}
              </div>
            </button>
          ) : (
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Conversation
            </div>
          )}
        </div>

        {/* Thread */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {initialLoading ? (
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-10">
              Loading messages…
            </div>
          ) : (
            <>
              {hasOlder && (
                <div className="flex justify-center mb-4">
                  <button
                    onClick={loadOlder}
                    disabled={loadingOlder}
                    className="h-8 px-4 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-60"
                  >
                    {loadingOlder ? "Loading…" : "Load older messages"}
                  </button>
                </div>
              )}

              {messages.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-10">
                  Say hi 👋
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((m) => (
                    <MessageBubble key={m.id} m={m} mine={m.senderId === me?.id} />
                  ))}
                </div>
              )}

              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-2 border-t border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-950 text-xs text-red-700 dark:text-red-300 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="font-semibold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Composer */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 1000))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder="Type a message…"
            className="flex-1 h-11 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900"
          />
          <button
            onClick={onSend}
            disabled={sending || !text.trim()}
            className="h-11 px-5 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Bubble ---------------- */

function MessageBubble({ m, mine }: { m: MessageItem; mine: boolean }) {
  return (
    <div className={["flex", mine ? "justify-end" : "justify-start"].join(" ")}>
      <div
        className={[
          "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
          mine
            ? "bg-blue-600 text-white rounded-br-sm"
            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm",
        ].join(" ")}
      >
        {m.text && <div className="whitespace-pre-wrap break-words">{m.text}</div>}
        {m.mediaUrl && (
          <img
            src={m.mediaUrl}
            alt=""
            className="mt-1 rounded-xl max-h-[260px] object-cover"
            loading="lazy"
          />
        )}
        <div
          className={[
            "mt-1 text-[10px]",
            mine ? "text-white/70" : "text-gray-400 dark:text-gray-500",
          ].join(" ")}
        >
          {formatRelative(m.createdAt)}
        </div>
      </div>
    </div>
  );
}
