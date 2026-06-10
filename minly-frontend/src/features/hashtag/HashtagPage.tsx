import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { AxiosError } from "axios";
import { motion } from "framer-motion";
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-[860px]"
    >
      <div className="mb-5">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">
            #{tag}
          </h1>
          {!loading && items.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
              {items.length}
              {hasMore ? "+" : ""} posts
            </span>
          )}
        </div>
        <div className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
          Posts tagged with #{tag}.
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-red-100 dark:border-red-900/50 shadow-sm p-4 mb-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-xl animate-pulse bg-gray-200/70 dark:bg-zinc-800"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 shadow-sm p-10 flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-zinc-800 grid place-items-center text-gray-400 dark:text-zinc-500">
            <HashIcon />
          </div>
          <div className="mt-3 text-sm font-semibold text-gray-900 dark:text-zinc-100">
            No posts yet
          </div>
          <div className="mt-1 text-xs text-gray-400 dark:text-zinc-500">
            No posts for this hashtag yet.
          </div>
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
                className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-semibold text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition disabled:opacity-50 disabled:pointer-events-none"
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

function HashIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 4 7 20M17 4l-2 16M4 9h17M3 15h17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
