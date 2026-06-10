import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { SavedSort } from "@/features/saved/api/bookmarks.api";
import MediaGrid from "@/shared/components/MediaGrid";
import { useSaved } from "./hooks/useSaved";

export default function SavedPage() {
  const { items, total, tab, sort, setTab, setSort, initialLoading, loadingMore, error, hasMore, loadMore, reload } =
    useSaved(24);

  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return items;

    return items.filter((m) => {
      const t = (m.title ?? "").toLowerCase();
      const d = (m.description ?? "").toLowerCase();
      return t.includes(query) || d.includes(query);
    });
  }, [items, q]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-[1200px]"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">Saved</h1>
            {total ? (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-300">
                {total}
              </span>
            ) : null}
          </div>
          <div className="text-sm text-gray-600 dark:text-zinc-400 mt-1">Manage your saved posts.</div>
        </div>

        <div className="w-full max-w-[360px]">
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search saved items…"
              className="w-full h-10 pl-10 pr-3 rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500 transition"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500">
              <SearchIcon />
            </span>
          </div>
        </div>
      </div>

      {/* Tabs (type) */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Tab active={tab === "ALL"} onClick={() => setTab("ALL")}>All</Tab>
          <Tab active={tab === "IMAGE"} onClick={() => setTab("IMAGE")}>Images</Tab>
          <Tab active={tab === "VIDEO"} onClick={() => setTab("VIDEO")}>Videos</Tab>
        </div>

        <div className="flex items-center gap-2">
          <SortSelect value={sort} onChange={setSort} />
          <div className="text-xs text-gray-400 dark:text-zinc-500">{total ? `${total} items` : ""}</div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-red-100 dark:border-red-900/50 shadow-sm p-4 mb-4">
          <div className="text-sm font-semibold text-red-600 dark:text-red-400">Failed to load saved</div>
          <div className="text-xs text-gray-500 dark:text-zinc-400 mt-1">{error}</div>
          <button
            onClick={reload}
            className="mt-3 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Content */}
      {initialLoading ? (
        <GridSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={q.trim() ? "No results" : "Nothing saved yet"}
          text={
            q.trim()
              ? `No saved items match "${q.trim()}".`
              : "Posts you bookmark will show up here."
          }
        />
      ) : (
        <>
          <MediaGrid items={filtered} />

          <div className="py-6 flex justify-center">
            {hasMore ? (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-semibold text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition disabled:opacity-50 disabled:pointer-events-none"
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            ) : (
              <div className="text-xs text-gray-400 dark:text-zinc-500">End of saved items</div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}

/* ---------------- UI ---------------- */

function Tab({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: React.ReactNode }) {
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

function SortSelect({ value, onChange }: { value: SavedSort; onChange: (v: SavedSort) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 dark:text-zinc-500">Sort</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SavedSort)}
        className="h-9 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-sm font-semibold text-gray-700 dark:text-zinc-200 outline-none hover:bg-gray-50 dark:hover:bg-zinc-800 focus:ring-2 focus:ring-blue-500/30 transition"
      >
        <option value="recent">Recently saved</option>
        <option value="oldest">Oldest</option>
        <option value="popularity">Popular</option>
      </select>
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 shadow-sm p-10 flex flex-col items-center text-center">
      <div className="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-zinc-800 grid place-items-center text-gray-400 dark:text-zinc-500">
        <BookmarkIcon />
      </div>
      <div className="mt-3 text-sm font-semibold text-gray-900 dark:text-zinc-100">{title}</div>
      <div className="mt-1 text-xs text-gray-400 dark:text-zinc-500">{text}</div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="aspect-square rounded-xl animate-pulse bg-gray-200/70 dark:bg-zinc-800" />
      ))}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-3.5L6 21V4.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
