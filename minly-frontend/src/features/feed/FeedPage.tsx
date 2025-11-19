// src/features/feed/FeedPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/BottomNav";
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

// =============== MediaCard ===============
function MediaCard({ item }: { item: MediaItem }) {
  const navigate = useNavigate();

  const isVideo = item.type === "VIDEO" || item.type === "video";
  const imageUrl = item.thumbnailUrl || item.url;
  const avatarUrl =
    item.uploader.avatarUrl ||
    "https://ui-avatars.com/api/?name=" +
      encodeURIComponent(item.uploader.name);

  const [liked, setLiked] = useState(item.isLikedByCurrentUser ?? false);
  const [likes, setLikes] = useState(item.likesCount);

  const description = item.description || "";
  const [expanded, setExpanded] = useState(false);
  const MAX_LEN = 120;

  const shouldTruncate = description.length > MAX_LEN;
  const visibleDesc =
    !description
      ? ""
      : expanded || !shouldTruncate
      ? description
      : description.slice(0, MAX_LEN) + "…";

  const goToProfile = () => navigate(`/users/${item.uploader.id}`);

  async function toggleLike() {
    const prevLiked = liked;
    const prevLikes = likes;

    // Optimistic UI
    const nextLiked = !prevLiked;
    setLiked(nextLiked);
    setLikes((p) => Math.max(p + (nextLiked ? 1 : -1), 0));

    try {
      await MediaAPI.toggleLike(item.id);
    } catch (err) {
      console.error(err);
      // rollback
      setLiked(prevLiked);
      setLikes(prevLikes);
    }
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-xl bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
      {/* Header */}
      <header
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={goToProfile}
      >
        <img
          className="size-10 rounded-full object-cover"
          src={avatarUrl}
          alt={item.uploader.name}
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

      {/* Media */}
      <div className="relative w-full cursor-pointer" onClick={goToProfile}>
        {isVideo ? (
          <video
            src={item.url}
            controls
            className="w-full aspect-square object-cover bg-black"
          />
        ) : (
          <img
            src={imageUrl}
            alt={item.title || "Media"}
            className="w-full aspect-square object-cover"
          />
        )}
      </div>

      {/* Description */}
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

        {/* Likes */}
        <div className="mt-1 flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLike();
            }}
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
}


// =============== Page: Global Feed ===============
export default function FeedPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFeed() {
      try {
        setLoading(true);
        setError(null);

        const res = await MediaAPI.getFeed(1, 20);
        const body = res.data;
        const data = (body as any).data ?? (body as any).items ?? [];
        setItems(data);
      } catch (err: any) {
        console.error(err);
        setError(
          err?.response?.data?.message ||
            "Failed to load feed. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    loadFeed();
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f6f8] flex justify-center">
      <div className="relative mx-auto flex h-auto min-h-screen w-full max-w-md flex-col bg-[#f7f6f8]">
        {/* Top Bar */}
        <header className="sticky top-0 z-10 flex flex-col gap-2 bg-[#f7f6f8]/80 p-4 pb-2 backdrop-blur-sm">
          <div className="flex h-12 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ad2bee] text-3xl">
                all_inclusive
              </span>
              <p className="text-xl font-bold text-[#161118]">Minly</p>
            </div>
          </div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-[#161118]">
            Global Feed
          </h1>
        </header>

        {/* Main Content */}
        <main className="flex flex-1 flex-col gap-6 p-4 pb-24">
          {loading && (
            <p className="text-center text-sm text-[#7c6189]">
              Loading feed...
            </p>
          )}

          {error && (
            <p className="text-center text-sm text-red-500">{error}</p>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="flex flex-col items-center gap-6 rounded-xl bg-white p-8 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
              <div className="flex size-32 items-center justify-center rounded-full bg-[#ad2bee]/10">
                <span className="material-symbols-outlined text-6xl text-[#ad2bee]">
                  photo_camera
                </span>
              </div>
              <div className="flex max-w-xs flex-col items-center gap-2 text-center">
                <p className="text-lg font-bold text-[#161118]">
                  No media yet.
                </p>
                <p className="text-sm font-normal leading-normal text-[#7c6189]">
                  Be the first to upload something and share it with the world!
                </p>
              </div>
            </div>
          )}

          {items.map((item) => (
            <MediaCard key={item.id} item={item} />
          ))}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
