import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { AxiosError } from "axios";
import MediaGrid from "@/shared/components/MediaGrid";
import type { FeedItem } from "@/features/feed/api/feed.api";
import { HashtagAPI } from "@/features/hashtag/api/hashtag.api";

export default function HashtagPage() {
  const { tag } = useParams();

  const [items, setItems] = useState<FeedItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (p: number, mode: "replace" | "append") => {
      if (!tag) return;
      try {
        setError(null);
        const d = await HashtagAPI.media(tag, p, 12);
        setItems((prev) => (mode === "append" ? [...prev, ...d.items] : d.items));
        setHasMore(d.hasMore);
        setPage(p);
      } catch (error) {
        const ax = error as AxiosError<{ message?: string }>;
        setError(ax.response?.data?.message ?? "Failed to load hashtag feed.");
      }
    },
    [tag]
  );

  useEffect(() => {
    setLoading(true);
    fetchPage(1, "replace").finally(() => setLoading(false));
  }, [fetchPage]);

  return (
    <div className="mx-auto max-w-[860px]">
      <div className="mb-5">
        <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          #{tag}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Posts tagged with #{tag}.
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-red-100 dark:border-red-900 shadow-sm p-4 mb-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/70 dark:border-gray-700 shadow-sm p-10 text-center text-sm text-gray-500 dark:text-gray-400">
          No posts for this hashtag yet.
        </div>
      ) : (
        <>
          <MediaGrid items={items} />
          {hasMore && (
            <div className="py-5 flex justify-center">
              <button
                onClick={async () => {
                  setLoadingMore(true);
                  await fetchPage(page + 1, "append").finally(() =>
                    setLoadingMore(false)
                  );
                }}
                disabled={loadingMore}
                className="h-10 px-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm font-semibold text-gray-800 dark:text-gray-200 disabled:opacity-60"
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
