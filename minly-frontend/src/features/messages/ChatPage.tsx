import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-[720px]"
    >
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col h-[78vh]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800 flex items-center gap-3">
          <button
            onClick={() => nav("/messages")}
            className="h-10 w-10 rounded-full grid place-items-center text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition shrink-0"
            aria-label="Back to messages"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </button>

          {participant ? (
            <button
              onClick={() => nav(`/profile/${participant.id}`)}
              className="flex items-center gap-3 min-w-0 rounded-xl hover:opacity-90 active:scale-[0.98] transition"
            >
              <Avatar name={participant.name} src={participant.avatarUrl} size={36} />
              <div className="text-sm font-semibold text-gray-900 dark:text-zinc-100 truncate">
                {participant.name}
              </div>
            </button>
          ) : (
            <div className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
              Conversation
            </div>
          )}
        </div>

        {/* Thread */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {initialLoading ? (
            <ThreadSkeleton />
          ) : (
            <>
              {hasOlder && (
                <div className="flex justify-center mb-4">
                  <button
                    onClick={loadOlder}
                    disabled={loadingOlder}
                    className="inline-flex items-center gap-1 rounded-full px-3 h-7 bg-gray-100 dark:bg-zinc-800 text-xs font-semibold text-gray-600 dark:text-zinc-300 hover:bg-gray-200/70 dark:hover:bg-zinc-700 transition disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {loadingOlder ? "Loading…" : "Load older messages"}
                  </button>
                </div>
              )}

              {messages.length === 0 ? (
                <div className="py-10 flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-zinc-800 grid place-items-center text-lg">
                    👋
                  </div>
                  <div className="mt-3 text-sm font-semibold text-gray-900 dark:text-zinc-100">
                    Say hi
                  </div>
                  <div className="mt-1 text-xs text-gray-400 dark:text-zinc-500">
                    Send a message to start the conversation.
                  </div>
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
          <div className="px-4 py-2 border-t border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50 text-xs text-red-700 dark:text-red-300 flex items-center justify-between">
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
        <div className="px-4 py-3 border-t border-gray-100 dark:border-zinc-800 flex items-center gap-3">
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
            className="flex-1 min-w-0 bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-[15px] text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500 transition"
          />
          <button
            onClick={onSend}
            disabled={sending || !text.trim()}
            aria-label="Send message"
            className="h-11 w-11 shrink-0 rounded-full grid place-items-center bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] transition disabled:opacity-50 disabled:pointer-events-none"
          >
            {sending ? (
              <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            ) : (
              <svg
                className="h-5 w-5 -translate-x-px"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ---------------- Bubble ---------------- */

function MessageBubble({ m, mine }: { m: MessageItem; mine: boolean }) {
  return (
    <div className={["flex", mine ? "justify-end" : "justify-start"].join(" ")}>
      <div
        className={[
          "max-w-[75%] px-3.5 py-2 text-sm leading-relaxed",
          mine
            ? "bg-blue-600 text-white rounded-2xl rounded-br-md"
            : "bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 rounded-2xl rounded-bl-md",
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
            mine ? "text-white/70" : "text-gray-400 dark:text-zinc-500",
          ].join(" ")}
        >
          {formatRelative(m.createdAt)}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Skeleton ---------------- */

function ThreadSkeleton() {
  const widths = ["w-40", "w-56", "w-32", "w-48", "w-36"];
  return (
    <div className="space-y-3 animate-pulse">
      {widths.map((w, i) => (
        <div
          key={i}
          className={["flex", i % 2 === 0 ? "justify-start" : "justify-end"].join(
            " "
          )}
        >
          <div
            className={[
              "h-10 rounded-2xl bg-gray-200/70 dark:bg-zinc-800",
              w,
              i % 2 === 0 ? "rounded-bl-md" : "rounded-br-md",
            ].join(" ")}
          />
        </div>
      ))}
    </div>
  );
}
