import { useNavigate } from "react-router-dom";

export type MediaGridItem = {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  type: "IMAGE" | "VIDEO" | string;
  title?: string | null;
  likesCount?: number;
  commentCount?: number;
};

/**
 * Reusable media result grid (search results, hashtag pages, …).
 * Uses thumbnailUrl as poster for videos.
 */
export default function MediaGrid({ items }: { items: MediaGridItem[] }) {
  const nav = useNavigate();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {items.map((m) => (
        <button
          key={m.id}
          onClick={() => nav(`/media/${m.id}`)}
          className="group relative w-full rounded-xl overflow-hidden bg-gray-100 dark:bg-zinc-800 border border-gray-200/70 dark:border-zinc-800 text-left hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          aria-label={`Open media: ${m.title ?? "Untitled"}`}
        >
          <div className="relative w-full aspect-square bg-gray-100 dark:bg-zinc-800">
            {m.type === "VIDEO" ? (
              m.thumbnailUrl ? (
                <img
                  src={m.thumbnailUrl}
                  alt={m.title ?? ""}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                  loading="lazy"
                />
              ) : (
                <video
                  src={m.url}
                  preload="metadata"
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                />
              )
            ) : (
              <img
                src={m.thumbnailUrl ?? m.url}
                alt={m.title ?? ""}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                loading="lazy"
              />
            )}

            {m.type === "VIDEO" && (
              <div className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 backdrop-blur-sm grid place-items-center text-white">
                <PlayIcon />
              </div>
            )}

            {/* Hover overlay: title + stats fade in */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out" />
            <div className="absolute inset-x-0 bottom-0 p-3 flex items-end justify-between gap-2 translate-y-1.5 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out">
              <div className="min-w-0">
                {(m.title ?? "").trim() ? (
                  <div className="text-xs font-semibold text-white truncate drop-shadow-sm">
                    {m.title}
                  </div>
                ) : null}
              </div>

              {(m.likesCount != null || m.commentCount != null) && (
                <div className="flex items-center gap-2 shrink-0">
                  {m.likesCount != null && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/40 backdrop-blur-sm px-2 py-0.5 text-xs font-semibold text-white">
                      <HeartIcon /> {m.likesCount}
                    </span>
                  )}
                  {m.commentCount != null && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/40 backdrop-blur-sm px-2 py-0.5 text-xs font-semibold text-white">
                      <CommentIcon /> {m.commentCount}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.14v13.72c0 .8.87 1.3 1.56.88l11-6.86a1.04 1.04 0 0 0 0-1.76l-11-6.86A1.04 1.04 0 0 0 8 5.14Z" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 21s-7.5-4.8-10-9.3C.4 8.4 2.4 4.5 6 4.5c2 0 3.4 1.1 4.2 2.3.4.6 1.2.6 1.6 0 .8-1.2 2.2-2.3 4.2-2.3 3.6 0 5.6 3.9 4 7.2C19.5 16.2 12 21 12 21Z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3C6.5 3 2 6.9 2 11.7c0 2.6 1.3 4.9 3.4 6.5-.1 1-.6 2.3-1.8 3.4 1.9 0 3.6-.7 4.8-1.5 1.1.3 2.3.5 3.6.5 5.5 0 10-3.9 10-8.9S17.5 3 12 3Z" />
    </svg>
  );
}
