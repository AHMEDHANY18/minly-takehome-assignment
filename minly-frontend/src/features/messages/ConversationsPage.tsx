import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type {
  ConversationItem,
} from "@/features/messages/api/messages.api";
import { useConversations } from "@/features/messages/hooks/useConversations";

export default function ConversationsPage() {
  const nav = useNavigate();
  const {
    items,
    hasMore,
    initialLoading,
    loadingMore,
    error,
    loadMore,
    reload,
  } = useConversations(20);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-[720px]"
    >
      <div className="mb-4">
        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">
          Messages
        </h1>
        <div className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
          Your direct conversations.
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900 shadow-sm p-4 mb-4">
          <div className="text-sm font-semibold text-red-600 dark:text-red-400">
            {error}
          </div>
          <button
            onClick={reload}
            className="mt-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 shadow-sm overflow-hidden">
        {initialLoading ? (
          <ListSkeleton />
        ) : items.length === 0 ? (
          <div className="p-10 flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-zinc-800 grid place-items-center text-gray-400 dark:text-zinc-500">
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </div>
            <div className="mt-4 text-sm font-semibold text-gray-900 dark:text-zinc-100">
              No conversations yet
            </div>
            <div className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
              Open someone's profile and tap "Message" to start chatting.
            </div>
            <button
              onClick={() => nav("/search")}
              className="mt-5 inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-[0.98] transition"
            >
              Find people
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-zinc-800">
            {items.map((c) => (
              <ConversationRow
                key={c.id}
                c={c}
                onOpen={() =>
                  nav(`/messages/${c.id}`, {
                    state: { participant: c.participant },
                  })
                }
              />
            ))}
          </div>
        )}
      </div>

      {!initialLoading && hasMore && (
        <div className="py-5 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-semibold text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition disabled:opacity-50 disabled:pointer-events-none"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </motion.div>
  );
}

/* ---------------- Row ---------------- */

function ConversationRow({
  c,
  onOpen,
}: {
  c: ConversationItem;
  onOpen: () => void;
}) {
  const preview = c.lastMessage
    ? c.lastMessage.text?.trim() || (c.lastMessage.mediaUrl ? "Media" : "")
    : "No messages yet";

  const time = c.lastMessageAt ?? c.lastMessage?.createdAt ?? null;

  return (
    <button
      onClick={onOpen}
      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-zinc-800/60 transition"
    >
      <Avatar name={c.participant.name} src={c.participant.avatarUrl} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-semibold text-gray-900 dark:text-zinc-100 truncate">
            {c.participant.name}
          </div>
          {time && (
            <div className="text-[11px] text-gray-400 dark:text-zinc-500 shrink-0">
              {formatRelative(time)}
            </div>
          )}
        </div>

        <div className="mt-0.5 flex items-center justify-between gap-2">
          <div
            className={[
              "text-xs truncate",
              c.unreadCount > 0
                ? "font-semibold text-gray-900 dark:text-zinc-100"
                : "text-gray-500 dark:text-zinc-400",
            ].join(" ")}
          >
            {preview}
          </div>

          {c.unreadCount > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-blue-600 text-white text-[11px] font-semibold shrink-0">
              {c.unreadCount > 99 ? "99+" : c.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/* ---------------- Shared bits ---------------- */

export function Avatar({
  name,
  src,
  size = 44,
}: {
  name: string;
  src: string | null;
  size?: number;
}) {
  const initial = (name?.[0] ?? "U").toUpperCase();

  return src ? (
    <img
      src={src}
      alt={name}
      style={{ width: size, height: size }}
      className="rounded-full object-cover bg-gray-100 dark:bg-zinc-800 shrink-0"
      loading="lazy"
    />
  ) : (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-gray-100 dark:bg-zinc-800 grid place-items-center font-semibold text-gray-600 dark:text-zinc-300 shrink-0"
    >
      {initial}
    </div>
  );
}

export function formatRelative(iso: string) {
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function ListSkeleton() {
  return (
    <div className="divide-y divide-gray-100 dark:divide-zinc-800 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="h-11 w-11 rounded-full bg-gray-200/70 dark:bg-zinc-800" />
          <div className="flex-1">
            <div className="h-3 w-32 bg-gray-200/70 dark:bg-zinc-800 rounded-xl" />
            <div className="mt-2 h-3 w-48 bg-gray-200/70 dark:bg-zinc-800 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
