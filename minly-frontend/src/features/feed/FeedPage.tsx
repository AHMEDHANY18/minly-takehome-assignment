import { useNavigate } from "react-router-dom";
import { useUserStore } from "@/shared/store/user.store";
import { SocialAPI, type SuggestedUser } from "@/shared/api/social.api";
import { useSuggestedUsers } from "./hooks/useSuggestedUsers";
import type { FeedItem, FeedMode } from "@/features/feed/api/feed.api";
import { useFeed } from "./hooks/useFeed";
import { useEffect, useState } from "react";
import { IconBookmark, IconComment, IconHeart, IconSend } from "./icons";

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
  } = useFeed(mode, 20);

  const followingCountFromMeta =
    meta && typeof meta === "object" && "followingCount" in meta
      ? Number(meta.followingCount ?? 0)
      : 0;

  // ✅ local state علشان optimistic update
  const [followingCount, setFollowingCount] = useState(0);

  // ✅ أول ما meta تتغير (home feed) نحدّث الرقم
  useEffect(() => {
    setFollowingCount(followingCountFromMeta);
  }, [followingCountFromMeta]);


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
        {error && (
          <div className="rounded-2xl bg-white border border-red-100 p-4 shadow-sm">
            <div className="text-sm text-red-600 font-semibold">
              Failed to load feed
            </div>
            <div className="text-xs text-gray-500 mt-1">{error}</div>
            <button
              onClick={reload}
              className="mt-3 text-sm font-semibold text-purple-700 hover:underline"
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
                <div className="text-xs text-gray-400">
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
/>      </aside>
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
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar name={item.uploader.name} src={item.uploader.avatarUrl} />
          <div className="leading-tight">
            <div className="text-sm font-semibold text-gray-900">
              {item.uploader.name}
            </div>
            <div className="text-xs text-gray-500">{formatTime(item.createdAt)}</div>
          </div>
        </div>
        <button className="h-9 w-9 rounded-full hover:bg-gray-50 transition" aria-label="More">
          ⋯
        </button>
      </div>

      {/* ✅ Media */}
      <button
        type="button"
        onClick={openDetails}
        className="block w-full text-left bg-gray-50"
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
                <div className="h-12 w-12 rounded-full bg-black/40 grid place-items-center text-white">
                  ▶
                </div>
              </div>
            </div>
          ) : (
            <video className="w-full max-h-[520px] object-cover" controls preload="metadata">
              <source src={item.url} />
            </video>
          )
        ) : (
          <img
            src={item.url}
            alt={item.title ?? "media"}
            className="w-full max-h-[520px] object-cover"
            loading="lazy"
          />
        )}
      </button>

      {/* Actions + Text */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-6 text-gray-900">
          <button
            onClick={() => onToggleLike(item.id)}
            className={
              "inline-flex items-center gap-2 hover:opacity-80 transition " +
              (item.isLiked ? "text-blue-600" : "")
            }
            aria-label="Like"
          >
            <IconHeart filled={item.isLiked} />
            <span className="text-sm font-medium">{item.likesCount}</span>
          </button>

          <button
            onClick={openDetails}
            className="inline-flex items-center gap-2 hover:opacity-80 transition"
            aria-label="Comments"
          >
            <IconComment />
            <span className="text-sm font-medium">{item.commentCount}</span>
          </button>

          <button className="inline-flex items-center gap-2 hover:opacity-80 transition" aria-label="Share">
            <IconSend />
          </button>

          <button
            onClick={() => onToggleBookmark(item.id)}
            className={"ml-auto hover:opacity-80 transition " + (item.isBookmarked ? "text-blue-600" : "")}
            aria-label="Bookmark"
          >
            <IconBookmark filled={item.isBookmarked} />
          </button>
        </div>

        <div className="mt-3">
          {item.title && <div className="text-base font-semibold text-gray-900">{item.title}</div>}
          {item.description && <p className="mt-1 text-sm text-gray-600 leading-relaxed">{item.description}</p>}
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
      onFollowSuccess?.(); // optional: increase followingCount in UI
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
    typeof followingCount === "number"
      ? followingCount
      : user?.followingCount ?? 0;
  return (
    <div className="sticky top-16 space-y-4">
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col items-center text-center">
          <div className="h-16 w-16 rounded-full bg-gray-100 grid place-items-center">
            <Avatar name={user?.name ?? "User"} src={user?.avatarUrl ?? null} size="lg" />
          </div>
          <div className="mt-3 font-semibold">{user?.name ?? "—"}</div>
          <div className="text-xs text-gray-500">{user?.email ?? ""}</div>

          <div className="mt-4 grid grid-cols-2 gap-3 w-full">


<Stat label="Followers" value={String(followers)} />
<Stat label="Following" value={String(followingUi)} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-sm p-4">
        <div className="font-semibold">Share your moment</div>
        <div className="mt-1 text-sm text-white/85">
          Upload photos or videos to connect with your community.
        </div>
        <button
          onClick={() => nav("/upload")}
          className="mt-4 w-full h-10 rounded-xl bg-white text-gray-900 font-semibold text-sm hover:bg-gray-100 transition"
        >
          Upload Media
        </button>
      </div>

      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-sm">Suggested for you</div>
          <button className="text-xs text-purple-700 hover:underline">See all</button>
        </div>

        <div className="mt-3 space-y-3">
          {loading ? (
            <div className="text-sm text-gray-500">Loading…</div>
          ) : users.length === 0 ? (
            <div className="text-sm text-gray-500">No suggestions right now.</div>
          ) : (
            users.map((u, idx) => (
              <div key={u.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={u.name} src={u.avatarUrl} />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{u.name}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {u.mediaCount} posts · {u.followerCount} followers
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleFollow(u, idx)}
                  disabled={!!pending[u.id]}
                  className="text-sm font-semibold text-blue-700 hover:underline disabled:opacity-60"
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-center">
      <div className="font-semibold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
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
        className="rounded-full object-cover"
      />
    );
  }

  return (
    <div
      style={{ width: dim, height: dim }}
      className="rounded-full bg-gray-100 border border-gray-200 grid place-items-center text-gray-700 font-semibold"
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
          className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden"
        >
          <div className="p-4 flex gap-3 items-center">
            <div className="h-9 w-9 rounded-full bg-gray-100" />
            <div className="flex-1">
              <div className="h-3 w-32 bg-gray-100 rounded" />
              <div className="mt-2 h-3 w-20 bg-gray-100 rounded" />
            </div>
          </div>
          <div className="h-[360px] bg-gray-50" />
          <div className="p-4">
            <div className="h-3 w-40 bg-gray-100 rounded" />
            <div className="mt-2 h-3 w-64 bg-gray-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyFeed() {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-10 text-center">
      <div className="text-lg font-semibold text-gray-900">No posts yet</div>
      <div className="mt-2 text-sm text-gray-500">
        Follow people or upload your first moment to see content here.
      </div>
    </div>
  );
}
