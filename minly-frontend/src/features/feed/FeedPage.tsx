import { Link, useNavigate } from "react-router-dom";
import { useUserStore } from "@/shared/store/user.store";
import { SocialAPI, type SuggestedUser } from "@/shared/api/social.api";
import { useSuggestedUsers } from "./hooks/useSuggestedUsers";
import type { FeedItem, FeedMode } from "@/features/feed/api/feed.api";
import { useFeed } from "./hooks/useFeed";
import { useEffect, useRef, useState } from "react";
import { IconBookmark, IconComment, IconEye, IconHeart, IconSend } from "./icons";
import { PAGINATION } from "@/shared/constant";
import HashtagText from "@/shared/components/HashtagText";
import { formatCompact } from "@/shared/utils/format";
import { StoriesBar } from "@/features/stories";

const MODE_TABS: { mode: FeedMode; label: string; to: string }[] = [
  { mode: "home", label: "Home", to: "/" },
  { mode: "explore", label: "Explore", to: "/explore" },
  { mode: "trending", label: "Trending", to: "/trending" },
];

export default function FeedPage({ mode = "home" }: { mode?: FeedMode }) {
  const {
    items,
    pagination,
    meta,
    initialLoading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    reload,
    updateItem,
  } = useFeed(mode, PAGINATION.DEFAULT_LIMIT);

  const followingCountFromMeta =
    meta && typeof meta === "object" && "followingCount" in meta
      ? Number((meta as any).followingCount ?? 0)
      : 0;

  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    setFollowingCount(followingCountFromMeta);
  }, [followingCountFromMeta]);

  /* -------------------- Infinite Scroll -------------------- */
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: "200px",
        threshold: 0,
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadingMore, loadMore]);

  /* -------------------- Actions -------------------- */

  const onToggleLike = async (mediaId: string) => {
    let snapshot: { isLiked: boolean; likesCount: number } | null = null;

    updateItem(mediaId, (it) => {
      snapshot = { isLiked: it.isLiked, likesCount: it.likesCount };
      const nextLiked = !it.isLiked;
      const nextLikes = Math.max(0, it.likesCount + (nextLiked ? 1 : -1));
      return { ...it, isLiked: nextLiked, likesCount: nextLikes };
    });

    try {
      await SocialAPI.toggleLike(mediaId);
    } catch {
      if (snapshot) updateItem(mediaId, (it) => ({ ...it, ...snapshot! }));
    }
  };

  const onToggleBookmark = async (mediaId: string) => {
    let snapshot: { isBookmarked: boolean } | null = null;

    updateItem(mediaId, (it) => {
      snapshot = { isBookmarked: it.isBookmarked };
      return { ...it, isBookmarked: !it.isBookmarked };
    });

    try {
      await SocialAPI.toggleBookmark(mediaId);
    } catch {
      if (snapshot) updateItem(mediaId, (it) => ({ ...it, ...snapshot! }));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,680px)_320px] gap-6">
      <div className="min-w-0 space-y-4">
        {/* Feed mode segmented pills */}
        <div
          className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 p-1"
          role="tablist"
          aria-label="Feed mode"
        >
          {MODE_TABS.map((t) => (
            <Link
              key={t.mode}
              to={t.to}
              role="tab"
              aria-selected={mode === t.mode}
              className={[
                "h-8 px-4 rounded-full inline-flex items-center text-sm font-semibold transition",
                mode === t.mode
                  ? "bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 shadow-sm"
                  : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100",
              ].join(" ")}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {mode === "home" && <StoriesBar />}

        {error && (
          <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-red-200/70 dark:border-red-900/60 p-4 shadow-sm">
            <div className="text-sm text-red-600 dark:text-red-400 font-semibold">
              Failed to load feed
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
          <FeedSkeleton />
        ) : items.length === 0 ? (
          <EmptyFeed />
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <PostCard
                key={item.id}
                item={item}
                onToggleLike={onToggleLike}
                onToggleBookmark={onToggleBookmark}
              />
            ))}

            {/* ✅ Infinite Scroll Sentinel (بديل Load more) */}
            <div
              ref={sentinelRef}
              className="py-2 flex justify-center"
              aria-hidden="true"
            >
              {hasMore ? (
                <div className="text-sm text-gray-400 dark:text-zinc-500">
                  {loadingMore ? "Loading…" : "Scroll to load more"}
                </div>
              ) : (
                <div className="text-xs text-gray-400 dark:text-zinc-500">
                  {pagination
                    ? `End of feed · page ${pagination.page}/${pagination.totalPages}`
                    : "End of feed"}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <aside className="hidden lg:block">
        <RightRail
          followingCount={followingCount}
          onFollowSuccess={() => setFollowingCount((c) => c + 1)}
        />
      </aside>
    </div>
  );
}

/* -------------------- Post Card -------------------- */

function PostCard({
  item,
  onToggleLike,
  onToggleBookmark,
}: {
  item: FeedItem;
  onToggleLike: (id: string) => void;
  onToggleBookmark: (id: string) => void;
}) {
  const nav = useNavigate();

  const openDetails = () => nav(`/media/${item.id}`, { state: { media: item } });

  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar name={item.uploader.name} src={item.uploader.avatarUrl} />
          <div className="leading-tight">
            <div className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
              {item.uploader.name}
            </div>
            <div className="text-xs text-gray-500 dark:text-zinc-400">
              {formatTime(item.createdAt)}
            </div>
          </div>
        </div>
        <button
          className="h-9 w-9 rounded-full grid place-items-center text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
          aria-label="More"
        >
          ⋯
        </button>
      </div>

      {/* ✅ Media */}
      <div className="px-3">
        <button
          type="button"
          onClick={openDetails}
          className="block w-full text-left rounded-xl overflow-hidden bg-gray-100 dark:bg-zinc-800"
          aria-label="Open media"
        >
          {item.type === "VIDEO" ? (
            item.thumbnailUrl ? (
              <div className="relative">
                <img
                  src={item.thumbnailUrl}
                  alt={item.title ?? "video"}
                  className="w-full max-h-[520px] object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 grid place-items-center">
                  <div className="h-12 w-12 rounded-full bg-black/40 backdrop-blur-sm grid place-items-center text-white">
                    ▶
                  </div>
                </div>
              </div>
            ) : (
              <video
                className="w-full max-h-[520px] object-cover"
                controls
                preload="metadata"
              >
                <source src={item.url} />
              </video>
            )
          ) : (
            <img
              src={item.thumbnailUrl ?? item.url}
              alt={item.title ?? "media"}
              className="w-full max-h-[520px] object-cover"
              loading="lazy"
            />
          )}
        </button>
      </div>

      {/* Actions + Text */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-1 text-gray-600 dark:text-zinc-400">
          <button
            onClick={() => onToggleLike(item.id)}
            className={[
              "inline-flex items-center gap-1.5 h-9 px-2.5 rounded-full transition active:scale-[0.98]",
              item.isLiked
                ? "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                : "hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-100",
            ].join(" ")}
            aria-label="Like"
          >
            <IconHeart filled={item.isLiked} />
            <span className="text-sm font-medium tabular-nums">{item.likesCount}</span>
          </button>

          <button
            onClick={openDetails}
            className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-100 transition active:scale-[0.98]"
            aria-label="Comments"
          >
            <IconComment />
            <span className="text-sm font-medium tabular-nums">{item.commentCount}</span>
          </button>

          {item.viewsCount != null && (
            <span
              className="inline-flex items-center gap-1.5 h-9 px-2.5 text-gray-400 dark:text-zinc-500"
              aria-label="Views"
            >
              <IconEye />
              <span className="text-sm font-medium tabular-nums">
                {formatCompact(item.viewsCount)}
              </span>
            </span>
          )}

          <button
            className="inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-100 transition active:scale-[0.98]"
            aria-label="Share"
          >
            <IconSend />
          </button>

          <button
            onClick={() => onToggleBookmark(item.id)}
            className={[
              "ml-auto inline-flex items-center justify-center h-9 w-9 rounded-full transition active:scale-[0.98]",
              item.isBookmarked
                ? "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                : "hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-100",
            ].join(" ")}
            aria-label="Bookmark"
          >
            <IconBookmark filled={item.isBookmarked} />
          </button>
        </div>

        <div className="mt-3">
          {item.title && (
            <div className="text-[15px] font-semibold text-gray-900 dark:text-zinc-100">
              <HashtagText text={item.title} />
            </div>
          )}
          {item.description && (
            <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
              <HashtagText text={item.description} />
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------- Right Rail -------------------- */

function RightRail({
  followingCount,
  onFollowSuccess,
}: {
  followingCount: number;
  onFollowSuccess?: () => void;
}) {
  const nav = useNavigate();
  const user = useUserStore((s) => s.user);

  const { users, loading, removeUser, restoreUser } = useSuggestedUsers();

  // loading state per user
  const [pending, setPending] = useState<Record<string, boolean>>({});

  const handleFollow = async (u: SuggestedUser, index: number) => {
    if (pending[u.id]) return;

    // ✅ optimistic: remove instantly
    setPending((p) => ({ ...p, [u.id]: true }));
    removeUser(u.id);

    try {
      await SocialAPI.follow(u.id);
      onFollowSuccess?.();
    } catch {
      // ❌ rollback
      restoreUser(u, index);
    } finally {
      setPending((p) => {
        const copy = { ...p };
        delete copy[u.id];
        return copy;
      });
    }
  };

  const followers = user?.followerCount ?? 0;

  const followingUi =
    typeof followingCount === "number" ? followingCount : user?.followingCount ?? 0;

  return (
    <div className="sticky top-16 space-y-4">
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 shadow-sm p-4">
        <div className="flex flex-col items-center text-center">
          <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-zinc-800 grid place-items-center">
            <Avatar
              name={user?.name ?? "User"}
              src={user?.avatarUrl ?? null}
              size="lg"
            />
          </div>
          <div className="mt-3 font-semibold text-gray-900 dark:text-zinc-100">
            {user?.name ?? "—"}
          </div>
          <div className="text-xs text-gray-500 dark:text-zinc-400">
            {user?.email ?? ""}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 w-full">
            <Stat label="Followers" value={String(followers)} />
            <Stat label="Following" value={String(followingUi)} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm p-4">
        <div className="font-semibold">Share your moment</div>
        <div className="mt-1 text-sm text-white/85">
          Upload photos or videos to connect with your community.
        </div>
        <button
          onClick={() => nav("/upload")}
          className="mt-4 inline-flex items-center justify-center w-full h-10 rounded-xl bg-white text-gray-900 font-semibold text-sm hover:bg-gray-100 active:scale-[0.98] transition"
        >
          Upload Media
        </button>
      </div>

      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
            Suggested for you
          </div>
          <button className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
            See all
          </button>
        </div>

        <div className="mt-3 space-y-3">
          {loading ? (
            <SuggestedSkeleton />
          ) : users.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-zinc-400">
              No suggestions right now.
            </div>
          ) : (
            users.map((u, idx) => (
              <div key={u.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={u.name} src={u.avatarUrl} />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 dark:text-zinc-100 truncate">
                      {u.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                      {u.mediaCount} posts · {u.followerCount} followers
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleFollow(u, idx)}
                  disabled={!!pending[u.id]}
                  className="shrink-0 inline-flex items-center justify-center h-8 px-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition disabled:opacity-50 disabled:pointer-events-none"
                >
                  {pending[u.id] ? "Following…" : "Follow"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SuggestedSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse">
          <div className="h-9 w-9 rounded-full bg-gray-200/70 dark:bg-zinc-800" />
          <div className="flex-1">
            <div className="h-3 w-24 rounded-xl bg-gray-200/70 dark:bg-zinc-800" />
            <div className="mt-2 h-3 w-32 rounded-xl bg-gray-200/70 dark:bg-zinc-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-200/70 dark:border-zinc-800 p-3 text-center">
      <div className="font-semibold text-gray-900 dark:text-zinc-100">{value}</div>
      <div className="text-xs text-gray-500 dark:text-zinc-400">{label}</div>
    </div>
  );
}

/* -------------------- Shared UI -------------------- */

function Avatar({
  name,
  src,
  size = "md",
}: {
  name: string;
  src?: string | null;
  size?: "md" | "lg";
}) {
  const dim = size === "lg" ? 56 : 36;
  const initial = (name?.[0] ?? "U").toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{ width: dim, height: dim }}
        className="rounded-full object-cover bg-gray-100 dark:bg-zinc-800"
        loading="lazy"
      />
    );
  }

  return (
    <div
      style={{ width: dim, height: dim }}
      className="rounded-full bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 grid place-items-center text-gray-600 dark:text-zinc-300 font-semibold"
    >
      {initial}
    </div>
  );
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

function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 shadow-sm overflow-hidden animate-pulse"
        >
          <div className="p-4 flex gap-3 items-center">
            <div className="h-9 w-9 rounded-full bg-gray-200/70 dark:bg-zinc-800" />
            <div className="flex-1">
              <div className="h-3 w-32 bg-gray-200/70 dark:bg-zinc-800 rounded-xl" />
              <div className="mt-2 h-3 w-20 bg-gray-200/70 dark:bg-zinc-800 rounded-xl" />
            </div>
          </div>
          <div className="mx-3 h-[360px] rounded-xl bg-gray-200/70 dark:bg-zinc-800" />
          <div className="p-4">
            <div className="h-3 w-40 bg-gray-200/70 dark:bg-zinc-800 rounded-xl" />
            <div className="mt-2 h-3 w-64 bg-gray-200/70 dark:bg-zinc-800 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyFeed() {
  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 shadow-sm p-10 flex flex-col items-center text-center">
      <div className="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-zinc-800 grid place-items-center text-gray-400 dark:text-zinc-500">
        <IconComment />
      </div>
      <div className="mt-3 text-sm font-semibold text-gray-900 dark:text-zinc-100">
        No posts yet
      </div>
      <div className="mt-1 text-xs text-gray-400 dark:text-zinc-500">
        Follow people or upload your first moment to see content here.
      </div>
    </div>
  );
}
