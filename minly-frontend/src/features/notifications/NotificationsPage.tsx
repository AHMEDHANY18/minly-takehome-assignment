import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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

  /* ---------------- FOLLOW CACHE LOGIC (بدون تغيير الديزاين) ---------------- */

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
    <div className="mx-auto max-w-[720px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-2xl font-semibold text-gray-900">
            Notifications
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up."}
          </div>
        </div>

        <button
          onClick={markAllRead}
          className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition inline-flex items-center gap-2"
        >
          ✓ Mark all as read
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4">
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
        <div className="rounded-2xl bg-white border border-red-100 shadow-sm p-4 mb-4">
          <div className="text-sm font-semibold text-red-600">
            Failed to load notifications
          </div>
          <div className="text-xs text-gray-500 mt-1">{error}</div>
          <button
            onClick={reload}
            className="mt-3 text-sm font-semibold text-blue-700 hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {initialLoading ? (
        <Skeleton />
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
                className="h-10 px-5 rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition text-sm font-semibold disabled:opacity-60"
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            ) : (
              <div className="text-xs text-gray-400">End of notifications</div>
            )}
          </div>
        </div>
      )}
    </div>
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
      <div className="text-xs font-semibold text-gray-400 mb-2">{title}</div>

      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        {rows.map((n, idx) => {
          const mediaId = n.mediaId ?? n.media?.id;

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
                "flex items-center gap-3 px-4 py-3 cursor-pointer",
                idx !== 0 ? "border-t border-gray-100" : "",
                "hover:bg-gray-50 transition",
              ].join(" ")}
            >
              {/* unread dot */}
              <div className="w-2">
                {!n.isRead ? (
                  <span className="block h-2 w-2 rounded-full bg-blue-600" />
                ) : null}
              </div>

              <button
                className="shrink-0"
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
              </button>

              <div className="min-w-0 flex-1">
                <div className="text-sm text-gray-900">
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
                  <span className="text-gray-700">{buildMessage(n)}</span>
                </div>

                <div className="text-xs text-gray-400 mt-1">
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
                  className="h-12 w-12 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 shrink-0"
                  aria-label="Open media"
                  onClick={(e) => {
                    e.stopPropagation();
                    openMedia();
                  }}
                >
                  <MediaThumb media={n.media ?? {}} />
                </button>
              ) : (
                <div className="h-12 w-12 rounded-xl border border-gray-100 bg-gray-50 shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
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
        className="h-9 px-4 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60"
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
        "h-9 px-4 rounded-full text-sm font-semibold transition disabled:opacity-60",
        following
          ? "bg-white border border-gray-300 text-gray-900 hover:bg-gray-50"
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
      <div className="h-full w-full bg-gray-100 grid place-items-center text-[10px] text-gray-400">
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
      {!ready && <div className="absolute inset-0 bg-gray-200" />}

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
        <div className="h-6 w-6 rounded-full bg-black/55 grid place-items-center text-white text-[10px]">
          ▶
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
        "h-9 px-4 rounded-full text-sm font-semibold border transition",
        active
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
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
        className="h-10 w-10 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="h-10 w-10 rounded-full bg-gray-100 border border-gray-200 grid place-items-center text-gray-700 font-semibold">
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

function Skeleton() {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
      <div className="space-y-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-100" />
            <div className="flex-1">
              <div className="h-3 w-2/3 bg-gray-100 rounded" />
              <div className="mt-2 h-3 w-24 bg-gray-100 rounded" />
            </div>
            <div className="h-12 w-12 rounded-xl bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
