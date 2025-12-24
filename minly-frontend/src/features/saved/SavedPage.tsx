import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { SavedMedia, SavedSort } from "@/features/saved/api/bookmarks.api";
import { useSaved } from "./hooks/useSaved";

export default function SavedPage() {
  const nav = useNavigate();
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
    <div className="mx-auto max-w-[1200px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="text-2xl font-semibold text-gray-900">Saved</div>
          <div className="text-sm text-gray-500 mt-1">Manage your saved posts.</div>
        </div>

        <div className="w-full max-w-[360px]">
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search saved items…"
              className="w-full h-10 pl-10 pr-3 rounded-full bg-white border border-gray-200 shadow-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">⌕</span>
          </div>
        </div>
      </div>

      {/* Tabs (type) */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Tab active={tab === "ALL"} onClick={() => setTab("ALL")}>All</Tab>
          <Tab active={tab === "IMAGE"} onClick={() => setTab("IMAGE")}>Images</Tab>
          <Tab active={tab === "VIDEO"} onClick={() => setTab("VIDEO")}>Videos</Tab>
        </div>

        <div className="flex items-center gap-2">
          <SortSelect value={sort} onChange={setSort} />
          <div className="text-xs text-gray-400">{total ? `${total} items` : ""}</div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl bg-white border border-red-100 shadow-sm p-4 mb-4">
          <div className="text-sm font-semibold text-red-600">Failed to load saved</div>
          <div className="text-xs text-gray-500 mt-1">{error}</div>
          <button onClick={reload} className="mt-3 text-sm font-semibold text-blue-700 hover:underline">
            Retry
          </button>
        </div>
      )}

      {/* Content */}
      {initialLoading ? (
        <GridSkeleton />
      ) : (
        <>
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
{filtered.map((m) => (
              <MediaCard key={m.id} m={m} onClick={() => nav(`/media/${m.id}`)} />
            ))}
          </div>

          <div className="py-6 flex justify-center">
            {hasMore ? (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="h-10 px-5 rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition text-sm font-semibold disabled:opacity-60"
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            ) : (
              <div className="text-xs text-gray-400">End of saved items</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- UI ---------------- */

function Tab({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={[
        "h-9 px-4 rounded-full text-sm font-semibold border transition",
        active ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function SortSelect({ value, onChange }: { value: SavedSort; onChange: (v: SavedSort) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400">Sort</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SavedSort)}
        className="h-9 px-3 rounded-full bg-white border border-gray-200 shadow-sm text-sm font-semibold text-gray-700 outline-none hover:bg-gray-50"
      >
        <option value="recent">Recently saved</option>
        <option value="oldest">Oldest</option>
        <option value="popularity">Popular</option>
      </select>
    </div>
  );
}


function MediaCard({ m, onClick }: { m: SavedMedia; onClick: () => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoReady, setVideoReady] = useState(false);

  const hasThumb = !!m.thumbnailUrl;
  const isVideo = m.type === "VIDEO";

  // IMAGE
  if (!isVideo) {
    return (
      <button
        onClick={onClick}
        className="w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm hover:shadow transition relative"
        aria-label="Open saved media"
      >
        <div className="relative w-full aspect-[4/5] bg-gray-100">
          <img
            src={m.thumbnailUrl ?? m.url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      </button>
    );
  }

  // VIDEO + thumbnail موجودة
  if (hasThumb) {
    return (
      <button
        onClick={onClick}
        className="w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm hover:shadow transition relative"
        aria-label="Open saved media"
      >
        <div className="relative w-full aspect-[4/5] bg-gray-100">
          <img
            src={m.thumbnailUrl!}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />

          <div className="absolute top-3 left-3 h-8 w-8 rounded-full bg-black/60 grid place-items-center text-white text-xs">
            ▶
          </div>
        </div>
      </button>
    );
  }

  // VIDEO + thumbnail مش موجودة => اعرض فيديو كـ preview (أول فريم)
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm hover:shadow transition relative"
      aria-label="Open saved media"
    >
      <div className="relative w-full aspect-[4/5] bg-gray-100">
        {/* placeholder بسيط لحد ما الفيديو يبقى جاهز */}
        {!videoReady && <div className="absolute inset-0 bg-gray-200" />}

        <video
          ref={videoRef}
          src={m.url}
          preload="metadata"
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          onLoadedMetadata={() => {
            // نخلي المتصفح يجيب جزء صغير ويثبت أول فريم
            const v = videoRef.current;
            if (!v) return;
            try {
              v.currentTime = 0.01; // يساعد يظهر أول فريم بدل شاشة سوداء
            } catch {
              // no-op
            }
          }}
          onSeeked={() => {
            const v = videoRef.current;
            if (!v) return;
            v.pause();
            setVideoReady(true);
          }}
          onLoadedData={() => setVideoReady(true)}
        />

        <div className="absolute top-3 left-3 h-8 w-8 rounded-full bg-black/60 grid place-items-center text-white text-xs">
          ▶
        </div>
      </div>
    </button>
  );
}



function GridSkeleton() {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="mb-4 break-inside-avoid rounded-2xl bg-gray-100 border border-gray-200 overflow-hidden">
          <div className="h-64 w-full" />
        </div>
      ))}
    </div>
  );
}
