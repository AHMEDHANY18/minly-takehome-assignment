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
    <div className="mx-auto max-w-[720px]">
      <div className="mb-4">
        <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Messages
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Your direct conversations.
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-red-100 dark:border-red-900 shadow-sm p-4 mb-4">
          <div className="text-sm font-semibold text-red-600">{error}</div>
          <button
            onClick={reload}
            className="mt-2 text-sm font-semibold text-blue-700 dark:text-blue-400 hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/70 dark:border-gray-700 shadow-sm overflow-hidden">
        {initialLoading ? (
          <ListSkeleton />
        ) : items.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              No conversations yet
            </div>
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Open someone's profile and tap "Message" to start chatting.
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
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
            className="h-10 px-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm font-semibold text-gray-800 dark:text-gray-200 disabled:opacity-60"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
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
      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition"
    >
      <Avatar name={c.participant.name} src={c.participant.avatarUrl} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {c.participant.name}
          </div>
          {time && (
            <div className="text-[11px] text-gray-400 shrink-0">
              {formatRelative(time)}
            </div>
          )}
        </div>

        <div className="mt-0.5 flex items-center justify-between gap-2">
          <div
            className={[
              "text-xs truncate",
              c.unreadCount > 0
                ? "font-semibold text-gray-900 dark:text-gray-100"
                : "text-gray-500 dark:text-gray-400",
            ].join(" ")}
          >
            {preview}
          </div>

          {c.unreadCount > 0 && (
            <span className="h-5 min-w-[20px] px-1 rounded-full bg-blue-600 text-white text-[11px] font-semibold grid place-items-center shrink-0">
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
      className="rounded-full object-cover shrink-0"
    />
  ) : (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 grid place-items-center text-gray-700 dark:text-gray-200 font-semibold shrink-0"
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
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="h-11 w-11 rounded-full bg-gray-100 dark:bg-gray-800" />
          <div className="flex-1">
            <div className="h-3 w-32 bg-gray-100 dark:bg-gray-800 rounded" />
            <div className="mt-2 h-3 w-48 bg-gray-100 dark:bg-gray-800 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
