import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { AxiosError } from "axios";
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
    <div className="mx-auto max-w-[860px]">
      <div className="mb-4">
        <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Search
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Find people and posts on Minly.
        </div>
      </div>

      <div className="relative mb-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search users or media…"
          autoFocus
          className="w-full h-12 pl-11 pr-4 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900"
        />
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          ⌕
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
        <EmptyState text="Start typing to search." />
      ) : tab === "USERS" ? (
        <UsersResults query={query} />
      ) : (
        <MediaResults query={query} />
      )}
    </div>
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
  if (users.length === 0) return <EmptyState text={`No users match "${query}".`} />;

  return (
    <>
      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/70 dark:border-gray-700 shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
        {users.map((u) => (
          <div key={u.id} className="flex items-center gap-3 px-4 py-3">
            <button
              onClick={() => nav(`/profile/${u.id}`)}
              className="flex items-center gap-3 min-w-0 flex-1 text-left"
            >
              <UserAvatar name={u.name} src={u.avatarUrl} />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {u.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {u.followerCount} followers
                </div>
              </div>
            </button>

            <button
              onClick={() => toggleFollow(u)}
              disabled={!!pending[u.id]}
              className={[
                "h-9 px-4 rounded-full text-sm font-semibold transition disabled:opacity-60 shrink-0",
                u.isFollowing
                  ? "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
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
  if (items.length === 0) return <EmptyState text={`No media match "${query}".`} />;

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
        "h-9 px-4 rounded-full text-sm font-semibold border transition",
        active
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function UserAvatar({ name, src }: { name: string; src: string | null }) {
  const initial = (name?.[0] ?? "U").toUpperCase();
  return src ? (
    <img src={src} alt={name} className="h-11 w-11 rounded-full object-cover shrink-0" />
  ) : (
    <div className="h-11 w-11 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 grid place-items-center text-gray-700 dark:text-gray-200 font-semibold shrink-0">
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
        className="h-10 px-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm font-semibold text-gray-800 dark:text-gray-200 disabled:opacity-60"
      >
        {loading ? "Loading…" : "Load more"}
      </button>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/70 dark:border-gray-700 shadow-sm p-10 text-center text-sm text-gray-500 dark:text-gray-400">
      {text}
    </div>
  );
}

function ErrorBox({ text }: { text: string }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-red-100 dark:border-red-900 shadow-sm p-4 text-sm text-red-600">
      {text}
    </div>
  );
}

function RowsSkeleton() {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/70 dark:border-gray-700 shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="h-11 w-11 rounded-full bg-gray-100 dark:bg-gray-800" />
          <div className="flex-1">
            <div className="h-3 w-32 bg-gray-100 dark:bg-gray-800 rounded" />
            <div className="mt-2 h-3 w-20 bg-gray-100 dark:bg-gray-800 rounded" />
          </div>
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
          className="aspect-square rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
        />
      ))}
    </div>
  );
}
