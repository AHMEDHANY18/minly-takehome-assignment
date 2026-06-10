import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { SocialAPI } from "@/shared/api/social.api";
import type { NotificationItem } from "@/features/notifications/api/notifications.api";
import {
  useNotifications,
  type NotificationsTab,
  matchesTab,
  normalizeType,
} from "./hooks/useNotifications";

export default function NotificationsPage() {
  const nav = useNavigate();

  const {
    items,
    initialLoading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    reload,
    markAllRead,
    markRead,
    unreadCount,
  } = useNotifications(20);

  const [tab, setTab] = useState<NotificationsTab>("ALL");

  const filtered = useMemo(() => {
    return items.filter((n) => {
      const t = normalizeType(n.type);
      if (tab === "ALL") return true;
      return matchesTab(String(t), tab);
    });
  }, [items, tab]);

  const grouped = useMemo(() => groupByTime(filtered), [filtered]);


  const [followMap, setFollowMap] = useState<Record<string, boolean>>({});
  const [busyMap, setBusyMap] = useState<Record<string, boolean>>({});
  const inFlightRef = useRef<Set<string>>(new Set());

  const followHasValue = useCallback(
    (userId: string) =>
      Object.prototype.hasOwnProperty.call(followMap, userId),
    [followMap]
  );

  const followValue = useCallback(
    (userId: string) => followMap[userId] ?? false,
    [followMap]
  );

  const followBusy = useCallback(
    (userId: string) => !!busyMap[userId],
    [busyMap]
  );

  const ensureFollow = useCallback(
    (userId: string) => {
      if (!userId) return;
      if (Object.prototype.hasOwnProperty.call(followMap, userId)) return;
      if (inFlightRef.current.has(userId)) return;

      inFlightRef.current.add(userId);

      SocialAPI.checkFollow(userId)
        .then((v) => {
          setFollowMap((prev) => ({ ...prev, [userId]: v }));
        })
        .catch(() => {
          // fallback
          setFollowMap((prev) => ({ ...prev, [userId]: false }));
        })
        .finally(() => {
          inFlightRef.current.delete(userId);
        });
    },
    [followMap]
  );

  const toggleFollow = useCallback(
    async (userId: string) => {
      if (!userId) return;
      if (!!busyMap[userId]) return;

      const before = followMap[userId] ?? false;

      // optimistic
      setFollowMap((prev) => ({ ...prev, [userId]: !before }));
      setBusyMap((prev) => ({ ...prev, [userId]: true }));

      try {
        const serverNext = await SocialAPI.toggleFollow(userId);
        if (typeof serverNext === "boolean") {
          setFollowMap((prev) => ({ ...prev, [userId]: serverNext }));
        }
      } catch {
        // rollback
        setFollowMap((prev) => ({ ...prev, [userId]: before }));
      } finally {
        setBusyMap((prev) => ({ ...prev, [userId]: false }));
      }
    },
    [busyMap, followMap]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-[720px]"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">
            Notifications
          </h1>
          <div className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up."}
          </div>
        </div>

        <button
          onClick={markAllRead}
          className="inline-flex items-center justify-center gap-2 h-9 px-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-semibold text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition shrink-0"
        >
          <CheckIcon /> Mark all as read
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Pill active={tab === "ALL"} onClick={() => setTab("ALL")}>
          All
        </Pill>
        <Pill active={tab === "LIKE"} onClick={() => setTab("LIKE")}>
          Likes
        </Pill>
        <Pill active={tab === "COMMENT"} onClick={() => setTab("COMMENT")}>
          Comments
        </Pill>
        <Pill active={tab === "FOLLOW"} onClick={() => setTab("FOLLOW")}>
          Follows
        </Pill>
        <Pill active={tab === "SYSTEM"} onClick={() => setTab("SYSTEM")}>
          System
        </Pill>
      </div>

      {/* Content */}
      {error && (
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-red-100 dark:border-red-900/50 shadow-sm p-4 mb-4">
          <div className="text-sm font-semibold text-red-600 dark:text-red-400">
            Failed to load notifications
          </div>
          <div className="text-xs text-gray-500 dark:text-zinc-400 mt-1">{error}</div>
          <button
            onClick={reload}
            className="mt-3 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {initialLoading ? (
        <Skeleton />
      ) : filtered.length === 0 && !hasMore && !error ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          {renderSection(
            "TODAY",
            grouped.today,
            nav,
            markRead,
            ensureFollow,
            toggleFollow,
            followHasValue,
            followValue,
            followBusy
          )}

          {renderSection(
            "THIS WEEK",
            grouped.thisWeek,
            nav,
            markRead,
            ensureFollow,
            toggleFollow,
            followHasValue,
            followValue,
            followBusy
          )}

          {renderSection(
            "EARLIER",
            grouped.earlier,
            nav,
            markRead,
            ensureFollow,
            toggleFollow,
            followHasValue,
            followValue,
            followBusy
          )}

          <div className="py-2 flex justify-center">
            {hasMore ? (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-semibold text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition disabled:opacity-50 disabled:pointer-events-none"
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            ) : (
              <div className="text-xs text-gray-400 dark:text-zinc-500">End of notifications</div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ---------------- UI ---------------- */

function renderSection(
  title: string,
  rows: NotificationItem[],
  nav: ReturnType<typeof useNavigate>,
  markRead: (id: string) => void,
  ensureFollow: (userId: string) => void,
  toggleFollow: (userId: string) => void,
  followHasValue: (userId: string) => boolean,
  followValue: (userId: string) => boolean,
  followBusy: (userId: string) => boolean
) {
  if (!rows.length) return null;

  return (
    <div>
      <div className="text-xs font-semibold tracking-wide text-gray-400 dark:text-zinc-500 mb-2">
        {title}
      </div>

      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 shadow-sm overflow-hidden">
        {rows.map((n, idx) => {
          const mediaId = n.mediaId ?? n.media?.id;
          const type = normalizeType(n.type);

          const openMedia = () => {
            if (!n.isRead) markRead(n.id);
            if (mediaId) nav(`/media/${mediaId}`);
          };

          return (
            <div
              key={n.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                if (normalizeType(n.type) === "FOLLOW") {
                  if (!n.isRead) markRead(n.id);
                  if (n.actor?.id) nav(`/users/${n.actor.id}`);
                  return;
                }
                openMedia();
              }}
              className={[
                "relative flex items-center gap-3 px-4 py-3 cursor-pointer transition",
                idx !== 0 ? "border-t border-gray-100 dark:border-zinc-800" : "",
                !n.isRead
                  ? "bg-blue-50/60 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                  : "hover:bg-gray-50 dark:hover:bg-zinc-800/60",
              ].join(" ")}
            >
              {/* unread left bar */}
              {!n.isRead && (
                <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 dark:bg-blue-400" />
              )}

              <button
                className="relative shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!n.isRead) markRead(n.id);
                  if (n.actor?.id) {
                    nav(`/users/${n.actor.id}`);
                  }
                }}
                aria-label="Open actor profile"
              >
                <Avatar name={n.actor?.name ?? "User"} src={n.actor?.avatarUrl ?? null} />
                <TypeBadge type={String(type)} />
              </button>

              <div className="min-w-0 flex-1">
                <div className="text-sm text-gray-900 dark:text-zinc-100">
                  <span
                    className="font-semibold hover:underline cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!n.isRead) markRead(n.id);
                      if (n.actor?.id) {
                        nav(`/users/${n.actor.id}`);
                      }
                    }}
                  >
                    {n.actor?.name ?? "Someone"}
                  </span>{" "}
                  <span className="text-gray-600 dark:text-zinc-400">{buildMessage(n)}</span>
                </div>

                <div className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
                  {formatTime(n.createdAt)}
                </div>
              </div>

              {/* Right side */}
              {normalizeType(n.type) === "FOLLOW" ? (
                <FollowButton
                  actorId={n.actor?.id ?? null}
                  notifId={n.id}
                  markRead={markRead}
                  ensureFollow={ensureFollow}
                  toggleFollow={toggleFollow}
                  followHasValue={followHasValue}
                  followValue={followValue}
                  followBusy={followBusy}
                />
              ) : n.media ? (
                <button
                  className="h-12 w-12 rounded-xl overflow-hidden border border-gray-200/70 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 shrink-0"
                  aria-label="Open media"
                  onClick={(e) => {
                    e.stopPropagation();
                    openMedia();
                  }}
                >
                  <MediaThumb media={n.media ?? {}} />
                </button>
              ) : (
                <div className="h-12 w-12 rounded-xl border border-gray-200/70 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Type icon (tinted circle) ---------------- */

function TypeBadge({ type }: { type: string }) {
  const tone =
    type === "LIKE"
      ? "bg-red-50 text-red-600 dark:bg-red-950/80 dark:text-red-400"
      : type === "COMMENT"
      ? "bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400"
      : type === "FOLLOW"
      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400"
      : "bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400";

  return (
    <span
      className={[
        "absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full grid place-items-center ring-2 ring-white dark:ring-zinc-900",
        tone,
      ].join(" ")}
      aria-hidden="true"
    >
      {type === "LIKE" ? (
        <HeartIcon />
      ) : type === "COMMENT" ? (
        <CommentIcon />
      ) : type === "FOLLOW" ? (
        <UserPlusIcon />
      ) : (
        <BellIcon />
      )}
    </span>
  );
}

/* ---------------- Follow Button (Logic only) ---------------- */

function FollowButton({
  actorId,
  notifId,
  markRead,
  ensureFollow,
  toggleFollow,
  followHasValue,
  followValue,
  followBusy,
}: {
  actorId: string | null;
  notifId: string;
  markRead: (id: string) => void;
  ensureFollow: (userId: string) => void;
  toggleFollow: (userId: string) => void;
  followHasValue: (userId: string) => boolean;
  followValue: (userId: string) => boolean;
  followBusy: (userId: string) => boolean;
}) {
  useEffect(() => {
    if (actorId) ensureFollow(actorId);
  }, [actorId, ensureFollow]);

  if (!actorId) {
    return (
      <button
        disabled
        className="inline-flex items-center justify-center h-9 px-4 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:pointer-events-none shrink-0"
      >
        Follow Back
      </button>
    );
  }

  const ready = followHasValue(actorId);
  const busy = followBusy(actorId);
  const following = followValue(actorId);

  const label = !ready || busy ? "..." : following ? "Following" : "Follow Back";

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        markRead(notifId);
        toggleFollow(actorId);
      }}
      disabled={!ready || busy}
      className={[
        "inline-flex items-center justify-center h-9 px-4 rounded-xl text-sm font-semibold active:scale-[0.98] transition disabled:opacity-50 disabled:pointer-events-none shrink-0",
        following
          ? "border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800"
          : "bg-blue-600 text-white hover:bg-blue-700",
      ].join(" ")}
    >
      {label}
    </button>
  );

}


function guessMediaTypeFromUrl(url?: string | null): "IMAGE" | "VIDEO" | undefined {
  if (!url) return undefined;
  const clean = url.split("?")[0].toLowerCase();

  if (/\.(mp4|webm|mov|m4v)$/i.test(clean)) return "VIDEO";
  if (/\.(png|jpe?g|gif|webp|avif)$/i.test(clean)) return "IMAGE";

  return undefined;
}

function normalizeMediaType(t?: string): "IMAGE" | "VIDEO" | undefined {
  const up = (t ?? "").toUpperCase();
  if (up === "IMAGE" || up === "VIDEO") return up;
  return undefined;
}
function MediaThumb({
  media,
}: {
  media: { url?: string | null; type?: string; thumbnailUrl?: string | null };
}) {
  const [broken, setBroken] = useState(false);

  const type =
    normalizeMediaType(media.type) ??
    guessMediaTypeFromUrl(media.url) ??
    "IMAGE";

  const isVideo = type === "VIDEO";
  const imgSrc = media.thumbnailUrl ?? (!isVideo ? media.url : undefined);

  if (!imgSrc || broken) {
    if (isVideo && media.url) return <VideoFirstFrame url={media.url} />;

    return (
      <div className="h-full w-full bg-gray-100 dark:bg-zinc-800 grid place-items-center text-[10px] text-gray-400 dark:text-zinc-500">
        No preview
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt=""
      className="h-full w-full object-cover"
      loading="lazy"
      decoding="async"
      onError={() => setBroken(true)}
    />
  );
}

function VideoFirstFrame({ url }: { url: string }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [ready, setReady] = useState(false);

  return (
    <div className="relative h-full w-full">
      {!ready && <div className="absolute inset-0 bg-gray-200/70 dark:bg-zinc-800" />}

      <video
        ref={ref}
        src={url}
        preload="metadata"
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover pointer-events-none"
        onLoadedMetadata={() => {
          const v = ref.current;
          if (!v) return;
          try {
            v.currentTime = 0.01;
          } catch {
          }
        }}
        onSeeked={() => {
          ref.current?.pause();
          setReady(true);
        }}
        onLoadedData={() => setReady(true)}
      />

      <div className="absolute inset-0 grid place-items-center">
        <div className="h-6 w-6 rounded-full bg-black/55 grid place-items-center text-white">
          <PlayIcon />
        </div>
      </div>
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "inline-flex items-center justify-center h-9 px-4 rounded-full text-sm font-semibold border active:scale-[0.98] transition",
        active
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-100",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Avatar({ name, src }: { name: string; src: string | null }) {
  const initial = (name?.[0] ?? "U").toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        loading="lazy"
        className="h-10 w-10 rounded-full object-cover bg-gray-100 dark:bg-zinc-800"
      />
    );
  }

  return (
    <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-zinc-800 grid place-items-center font-semibold text-gray-600 dark:text-zinc-300">
      {initial}
    </div>
  );
}

function buildMessage(n: NotificationItem) {
  const t = normalizeType(n.type);

  if (t === "LIKE") return "liked your post.";
  if (t === "FOLLOW") return "started following you.";
  if (t === "COMMENT") {
    const txt = n.comment?.text ? `: “${truncate(n.comment.text, 60)}”` : ".";
    return `commented on your post${txt}`;
  }

  return "sent you a notification.";
}

function truncate(s: string, n: number) {
  if (!s) return s;
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  } catch {
    return "";
  }
}

function groupByTime(items: NotificationItem[]) {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;

  const today: NotificationItem[] = [];
  const thisWeek: NotificationItem[] = [];
  const earlier: NotificationItem[] = [];

  for (const n of items) {
    const t = new Date(n.createdAt).getTime();
    if (t >= startOfToday) today.push(n);
    else if (t >= weekAgo) thisWeek.push(n);
    else earlier.push(n);
  }

  return { today, thisWeek, earlier };
}

function EmptyState() {
  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 shadow-sm p-10 flex flex-col items-center text-center">
      <div className="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-zinc-800 grid place-items-center text-gray-400 dark:text-zinc-500">
        <BellIconLarge />
      </div>
      <div className="mt-3 text-sm font-semibold text-gray-900 dark:text-zinc-100">
        No notifications
      </div>
      <div className="mt-1 text-xs text-gray-400 dark:text-zinc-500">
        Likes, comments and follows will show up here.
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 shadow-sm p-4">
      <div className="space-y-4 animate-pulse">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-200/70 dark:bg-zinc-800" />
            <div className="flex-1">
              <div className="h-3 w-2/3 bg-gray-200/70 dark:bg-zinc-800 rounded-full" />
              <div className="mt-2 h-3 w-24 bg-gray-200/70 dark:bg-zinc-800 rounded-full" />
            </div>
            <div className="h-12 w-12 rounded-xl bg-gray-200/70 dark:bg-zinc-800" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Icons ---------------- */

function HeartIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 21s-7.5-4.8-10-9.3C.4 8.4 2.4 4.5 6 4.5c2 0 3.4 1.1 4.2 2.3.4.6 1.2.6 1.6 0 .8-1.2 2.2-2.3 4.2-2.3 3.6 0 5.6 3.9 4 7.2C19.5 16.2 12 21 12 21Z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3C6.5 3 2 6.9 2 11.7c0 2.6 1.3 4.9 3.4 6.5-.1 1-.6 2.3-1.8 3.4 1.9 0 3.6-.7 4.8-1.5 1.1.3 2.3.5 3.6.5 5.5 0 10-3.9 10-8.9S17.5 3 12 3Z" />
    </svg>
  );
}

function UserPlusIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-3.3 0-7 1.7-7 4v2h14v-2c0-2.3-3.7-4-7-4Zm11-5V6h-2v3h-3v2h3v3h2v-3h3V9h-3Z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 22a2.5 2.5 0 0 0 2.5-2.5h-5A2.5 2.5 0 0 0 12 22Zm8-5v-1l-2-2v-4.5C18 6 15.5 3.5 12 3.5S6 6 6 9.5V14l-2 2v1h16Z" />
    </svg>
  );
}

function BellIconLarge() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M18 9.5C18 6 15.5 3.5 12 3.5S6 6 6 9.5V14l-2 2.5h16L18 14V9.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M10 19.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m4 12.5 5 5L20 6.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.14v13.72c0 .8.87 1.3 1.56.88l11-6.86a1.04 1.04 0 0 0 0-1.76l-11-6.86A1.04 1.04 0 0 0 8 5.14Z" />
    </svg>
  );
}
