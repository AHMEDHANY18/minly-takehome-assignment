// src/features/feed/FeedPage.tsx
import { memo, useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MediaAPI, type MediaItem } from "../../api/media";

function formatTimeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d ago`;
}

function formatLikes(n: number) {
  if (n < 1_000) return n.toString();
  if (n < 1_000_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
}

const MediaCard = memo(function MediaCard({ item }: { item: MediaItem }) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(item.isLikedByCurrentUser ?? false);
  const [likes, setLikes] = useState(item.likesCount);
  const [expanded, setExpanded] = useState(false);

  const isVideo = item.type === "VIDEO" || item.type === "video";
  const imageUrl = item.thumbnailUrl || item.url;
  const avatarUrl =
    item.uploader.avatarUrl ||
    "https://ui-avatars.com/api/?name=" +
      encodeURIComponent(item.uploader.name);

  const description = item.description || "";
  const MAX_LEN = 120;
  const shouldTruncate = description.length > MAX_LEN;
  const visibleDesc = useMemo(() => {
    if (!description) return "";
    if (expanded || !shouldTruncate) return description;
    return description.slice(0, MAX_LEN) + "...";
  }, [description, expanded, shouldTruncate]);

  const goToProfile = useCallback(() => navigate(`/users/${item.uploader.id}`), [
    navigate,
    item.uploader.id,
  ]);

  const toggleLike = useCallback(async () => {
    const prevLiked = liked;
    const prevLikes = likes;
    const nextLiked = !prevLiked;

    setLiked(nextLiked);
    setLikes((p) => Math.max(p + (nextLiked ? 1 : -1), 0));

    try {
      await MediaAPI.toggleLike(item.id);
    } catch (err) {
      console.error(err);
      setLiked(prevLiked);
      setLikes(prevLikes);
    }
  }, [item.id, liked, likes]);

  return (
    <article className="flex flex-col overflow-hidden rounded-xl bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
      <header
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={goToProfile}
      >
        <img
          className="size-10 rounded-full object-cover"
          src={avatarUrl}
          alt={item.uploader.name}
          loading="lazy"
        />
        <div>
          <p className="font-bold text-[#161118] capitalize">
            {item.uploader.name}
          </p>
          <p className="text-sm text-[#7c6189]">
            {formatTimeAgo(item.createdAt)}
          </p>
        </div>
      </header>

      <div className="relative w-full cursor-pointer" onClick={goToProfile}>
        {isVideo ? (
          <video
            src={item.url}
            controls
            className="w-full aspect-square object-cover bg-black"
            preload="metadata"
          />
        ) : (
          <img
            src={imageUrl}
            alt={item.title || "Media"}
            className="w-full aspect-square object-cover"
            loading="lazy"
          />
        )}
      </div>

      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-[#161118] truncate">
              {item.title || "Untitled media"}
            </p>

            {visibleDesc && (
              <p className="mt-1 text-base text-[#7c6189] break-words">
                {visibleDesc}
              </p>
            )}
          </div>

          {shouldTruncate && (
            <button
              className="text-sm font-bold text-[#ad2bee] hover:underline"
              onClick={() => setExpanded((prev) => !prev)}
            >
              {expanded ? "Hide" : "More"}
            </button>
          )}
        </div>

        <div className="mt-1 flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLike();
            }}
            aria-pressed={liked}
            className={`flex items-center gap-1 transition ${
              liked ? "text-[#e11d48]" : "text-[#7c6189] hover:text-[#e11d48]"
            }`}
          >
            <span
              className={`material-symbols-outlined text-[22px] ${
                liked ? "filled" : ""
              }`}
            >
              favorite
            </span>
          </button>

          <p className="text-sm font-bold tracking-wide text-[#7c6189]">
            {formatLikes(likes)}
          </p>
        </div>
      </div>
    </article>
  );
});

export default function FeedPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadFeed() {
      try {
        setLoading(true);
        setError(null);

        const res = await MediaAPI.getFeed(1, 50);
        const data = res.data.data ?? res.data.items ?? [];
        if (active) setItems(data);
      } catch (err: any) {
        console.error(err);
        if (active) {
          setError(
            err?.response?.data?.message ||
              "Failed to load feed. Please try again."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadFeed();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <p className="text-center text-sm text-[#7c6189]">Loading feed...</p>
    );
  }

  if (error) {
    return <p className="text-center text-sm text-red-500">{error}</p>;
  }

  if (!items.length) {
    return (
      <div className="flex flex-col items-center gap-6 rounded-xl bg-white p-8 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
        <div className="flex size-32 items-center justify-center rounded-full bg-[#ad2bee]/10">
          <span className="material-symbols-outlined text-6xl text-[#ad2bee]">
            photo_camera
          </span>
        </div>
        <div className="flex max-w-xs flex-col items-center gap-2 text-center">
          <p className="text-lg font-bold text-[#161118]">No media yet.</p>
          <p className="text-sm font-normal leading-normal text-[#7c6189]">
            Be the first to upload something and share it with the world!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {items.map((item) => (
        <MediaCard key={item.id} item={item} />
      ))}
    </div>
  );
}
