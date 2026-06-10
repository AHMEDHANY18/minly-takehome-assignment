import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AxiosError } from "axios";
import { motion } from "framer-motion";
import { BlockAPI, type BlockedUser } from "@/features/profile/api/block.api";

export default function BlockedUsersPage() {
  const nav = useNavigate();

  const [users, setUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    BlockAPI.list()
      .then((res) => {
        if (!alive) return;
        setUsers(res.data.data.users ?? []);
      })
      .catch((error: AxiosError<{ message?: string }>) => {
        if (!alive) return;
        setError(error.response?.data?.message ?? "Failed to load blocked users.");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const unblock = async (u: BlockedUser) => {
    if (pending[u.id]) return;
    setPending((p) => ({ ...p, [u.id]: true }));

    // optimistic remove
    setUsers((prev) => prev.filter((x) => x.id !== u.id));

    try {
      await BlockAPI.toggle(u.id);
    } catch {
      // rollback
      setUsers((prev) => (prev.some((x) => x.id === u.id) ? prev : [u, ...prev]));
    } finally {
      setPending((p) => {
        const copy = { ...p };
        delete copy[u.id];
        return copy;
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-[720px]"
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">
            Blocked users
          </h1>
          <div className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
            People you blocked can't follow or message you.
          </div>
        </div>

        <button
          onClick={() => nav("/profile/edit")}
          className="inline-flex items-center justify-center gap-2 h-9 px-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-semibold text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition shrink-0"
        >
          Back
        </button>
      </div>

      {error && (
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-red-100 dark:border-red-900/50 shadow-sm p-4 mb-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 shadow-sm overflow-hidden">
        {loading ? (
          <RowsSkeleton />
        ) : users.length === 0 ? (
          <div className="p-10 flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-zinc-800 grid place-items-center text-gray-400 dark:text-zinc-500">
              <ShieldIcon />
            </div>
            <div className="mt-3 text-sm font-semibold text-gray-900 dark:text-zinc-100">
              No blocked users
            </div>
            <div className="mt-1 text-xs text-gray-400 dark:text-zinc-500">
              You haven't blocked anyone.
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-zinc-800">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                {u.avatarUrl ? (
                  <img
                    src={u.avatarUrl}
                    alt={u.name}
                    loading="lazy"
                    className="h-10 w-10 rounded-full object-cover bg-gray-100 dark:bg-zinc-800 shrink-0"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-zinc-800 grid place-items-center font-semibold text-gray-600 dark:text-zinc-300 shrink-0">
                    {(u.name?.[0] ?? "U").toUpperCase()}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-zinc-100 truncate">
                    {u.name}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-zinc-500">
                    Blocked {formatDate(u.blockedAt)}
                  </div>
                </div>

                <button
                  onClick={() => unblock(u)}
                  disabled={!!pending[u.id]}
                  className="inline-flex items-center justify-center h-9 px-4 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-semibold text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition disabled:opacity-50 disabled:pointer-events-none shrink-0"
                >
                  {pending[u.id] ? "…" : "Unblock"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function RowsSkeleton() {
  return (
    <div className="divide-y divide-gray-100 dark:divide-zinc-800">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
          <div className="h-10 w-10 rounded-full bg-gray-200/70 dark:bg-zinc-800" />
          <div className="flex-1">
            <div className="h-3 w-32 bg-gray-200/70 dark:bg-zinc-800 rounded-full" />
            <div className="mt-2 h-3 w-24 bg-gray-200/70 dark:bg-zinc-800 rounded-full" />
          </div>
          <div className="h-9 w-20 rounded-xl bg-gray-200/70 dark:bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6l-7-3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}
