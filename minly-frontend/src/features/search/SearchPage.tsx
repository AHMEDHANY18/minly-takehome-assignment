import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { AxiosError } from "axios";
import { motion } from "framer-motion";
import { SocialAPI } from "@/shared/api/social.api";
import MediaGrid from "@/shared/components/MediaGrid";
import type { FeedItem } from "@/features/feed/api/feed.api";
import { SearchAPI, type SearchUser } from "@/features/search/api/search.api";

type TabKey = "USERS" | "MEDIA";

const DEBOUNCE_MS = 350;

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [input, setInput] = useState(searchParams.get("q") ?? "");
  const [query, setQuery] = useState(input.trim());
  const [tab, setTab] = useState<TabKey>("USERS");

  // debounce input → query
  useEffect(() => {
    const t = setTimeout(() => {
      const q = input.trim();
      setQuery(q);
      setSearchParams(q ? { q } : {}, { replace: true });
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [input, setSearchParams]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-[860px]"
    >
      <div className="mb-4">
        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">
          Search
        </h1>
        <div className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
          Find people and posts on Minly.
        </div>
      </div>

      <div className="relative mb-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search users or media…"
          autoFocus
          className="w-full h-12 pl-11 pr-4 rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 text-[15px] text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500 transition"
        />
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500">
          <SearchIcon />
        </span>
      </div>

      <div className="flex items-center gap-2 mb-5">
        <TabButton active={tab === "USERS"} onClick={() => setTab("USERS")}>
          Users
        </TabButton>
        <TabButton active={tab === "MEDIA"} onClick={() => setTab("MEDIA")}>
          Media
        </TabButton>
      </div>

      {!query ? (
        <EmptyState title="Search Minly" text="Start typing to find users and media." />
      ) : tab === "USERS" ? (
        <UsersResults query={query} />
      ) : (
        <MediaResults query={query} />
      )}
    </motion.div>
  );
}

/* ---------------- Users tab ---------------- */

function UsersResults({ query }: { query: string }) {
  const nav = useNavigate();
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Record<string, boolean>>({});

  const fetchPage = useCallback(
    async (p: number, mode: "replace" | "append") => {
      try {
        setError(null);
        const res = await SearchAPI.users(query, p, 10);
        const d = res.data.data;
        setUsers((prev) => (mode === "append" ? [...prev, ...d.users] : d.users));
        setHasMore(!!d.hasMore);
        setPage(p);
      } catch (error) {
        const ax = error as AxiosError<{ message?: string }>;
        setError(ax.response?.data?.message ?? "Search failed.");
      }
    },
    [query]
  );

  useEffect(() => {
    setLoading(true);
    fetchPage(1, "replace").finally(() => setLoading(false));
  }, [fetchPage]);

  const toggleFollow = async (u: SearchUser) => {
    if (pending[u.id]) return;
    setPending((p) => ({ ...p, [u.id]: true }));

    const before = u.isFollowing;
    setUsers((prev) =>
      prev.map((x) =>
        x.id === u.id
          ? {
              ...x,
              isFollowing: !before,
              followerCount: Math.max(0, x.followerCount + (before ? -1 : 1)),
            }
          : x
      )
    );

    try {
      const serverNext = await SocialAPI.toggleFollow(u.id);
      if (typeof serverNext === "boolean") {
        setUsers((prev) =>
          prev.map((x) =>
            x.id === u.id ? { ...x, isFollowing: serverNext } : x
          )
        );
      }
    } catch {
      setUsers((prev) =>
        prev.map((x) =>
          x.id === u.id
            ? {
                ...x,
                isFollowing: before,
                followerCount: Math.max(0, x.followerCount + (before ? 1 : -1)),
              }
            : x
        )
      );
    } finally {
      setPending((p) => {
        const copy = { ...p };
        delete copy[u.id];
        return copy;
      });
    }
  };

  if (loading) return <RowsSkeleton />;
  if (error) return <ErrorBox text={error} />;
  if (users.length === 0)
    return <EmptyState title="No results" text={`No users match "${query}".`} />;

  return (
    <>
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 shadow-sm divide-y divide-gray-100 dark:divide-zinc-800">
        {users.map((u) => (
          <div key={u.id} className="flex items-center gap-3 px-4 py-3">
            <button
              onClick={() => nav(`/profile/${u.id}`)}
              className="flex items-center gap-3 min-w-0 flex-1 text-left"
            >
              <UserAvatar name={u.name} src={u.avatarUrl} />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 dark:text-zinc-100 truncate">
                  {u.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                  {u.followerCount} followers
                </div>
              </div>
            </button>

            <button
              onClick={() => toggleFollow(u)}
              disabled={!!pending[u.id]}
              className={[
                "inline-flex items-center justify-center h-9 px-4 rounded-xl text-sm font-semibold active:scale-[0.98] transition disabled:opacity-50 disabled:pointer-events-none shrink-0",
                u.isFollowing
                  ? "border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800"
                  : "bg-blue-600 text-white hover:bg-blue-700",
              ].join(" ")}
            >
              {pending[u.id] ? "…" : u.isFollowing ? "Following" : "Follow"}
            </button>
          </div>
        ))}
      </div>

      <LoadMore
        hasMore={hasMore}
        loading={loadingMore}
        onClick={async () => {
          setLoadingMore(true);
          await fetchPage(page + 1, "append").finally(() =>
            setLoadingMore(false)
          );
        }}
      />
    </>
  );
}

/* ---------------- Media tab ---------------- */

function MediaResults({ query }: { query: string }) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (p: number, mode: "replace" | "append") => {
      try {
        setError(null);
        const res = await SearchAPI.media(query, p, 12);
        const d = res.data.data;
        setItems((prev) => (mode === "append" ? [...prev, ...d.items] : d.items));
        setHasMore(!!d.hasMore);
        setPage(p);
      } catch (error) {
        const ax = error as AxiosError<{ message?: string }>;
        setError(ax.response?.data?.message ?? "Search failed.");
      }
    },
    [query]
  );

  useEffect(() => {
    setLoading(true);
    fetchPage(1, "replace").finally(() => setLoading(false));
  }, [fetchPage]);

  if (loading) return <GridSkeleton />;
  if (error) return <ErrorBox text={error} />;
  if (items.length === 0)
    return <EmptyState title="No results" text={`No media match "${query}".`} />;

  return (
    <>
      <MediaGrid items={items} />
      <LoadMore
        hasMore={hasMore}
        loading={loadingMore}
        onClick={async () => {
          setLoadingMore(true);
          await fetchPage(page + 1, "append").finally(() =>
            setLoadingMore(false)
          );
        }}
      />
    </>
  );
}

/* ---------------- Shared UI ---------------- */

function TabButton({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
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

function UserAvatar({ name, src }: { name: string; src: string | null }) {
  const initial = (name?.[0] ?? "U").toUpperCase();
  return src ? (
    <img
      src={src}
      alt={name}
      loading="lazy"
      className="h-10 w-10 rounded-full object-cover bg-gray-100 dark:bg-zinc-800 shrink-0"
    />
  ) : (
    <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-zinc-800 grid place-items-center font-semibold text-gray-600 dark:text-zinc-300 shrink-0">
      {initial}
    </div>
  );
}

function LoadMore({
  hasMore,
  loading,
  onClick,
}: {
  hasMore: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  if (!hasMore) return null;
  return (
    <div className="py-5 flex justify-center">
      <button
        onClick={onClick}
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-semibold text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition disabled:opacity-50 disabled:pointer-events-none"
      >
        {loading ? "Loading…" : "Load more"}
      </button>
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 shadow-sm p-10 flex flex-col items-center text-center">
      <div className="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-zinc-800 grid place-items-center text-gray-400 dark:text-zinc-500">
        <SearchIcon />
      </div>
      <div className="mt-3 text-sm font-semibold text-gray-900 dark:text-zinc-100">{title}</div>
      <div className="mt-1 text-xs text-gray-400 dark:text-zinc-500">{text}</div>
    </div>
  );
}

function ErrorBox({ text }: { text: string }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-red-100 dark:border-red-900/50 shadow-sm p-4 text-sm text-red-600 dark:text-red-400">
      {text}
    </div>
  );
}

function RowsSkeleton() {
  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 shadow-sm divide-y divide-gray-100 dark:divide-zinc-800">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
          <div className="h-10 w-10 rounded-full bg-gray-200/70 dark:bg-zinc-800" />
          <div className="flex-1">
            <div className="h-3 w-32 bg-gray-200/70 dark:bg-zinc-800 rounded-full" />
            <div className="mt-2 h-3 w-20 bg-gray-200/70 dark:bg-zinc-800 rounded-full" />
          </div>
          <div className="h-9 w-20 rounded-xl bg-gray-200/70 dark:bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square rounded-xl animate-pulse bg-gray-200/70 dark:bg-zinc-800"
        />
      ))}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
