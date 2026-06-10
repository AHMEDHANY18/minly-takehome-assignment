import { useNavigate } from "react-router-dom";

export type MediaGridItem = {
  id: string;
  url: string;
  thumbnailUrl: string | null;
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
          className="relative w-full rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow transition text-left"
          aria-label={`Open media: ${m.title ?? "Untitled"}`}
        >
          <div className="relative w-full aspect-square bg-gray-100 dark:bg-gray-800">
            {m.type === "VIDEO" ? (
              m.thumbnailUrl ? (
                <img
                  src={m.thumbnailUrl}
                  alt={m.title ?? ""}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <video
                  src={m.url}
                  preload="metadata"
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />
              )
            ) : (
              <img
                src={m.thumbnailUrl ?? m.url}
                alt={m.title ?? ""}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
            )}

            {m.type === "VIDEO" && (
              <div className="absolute top-3 left-3 h-8 w-8 rounded-full bg-black/60 grid place-items-center text-white text-xs">
                ▶
              </div>
            )}
          </div>

          {(m.title ?? "").trim() ? (
            <div className="px-3 py-2">
              <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                {m.title}
              </div>
            </div>
          ) : null}
        </button>
      ))}
    </div>
  );
}
