import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AxiosError } from "axios";
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
    <div className="mx-auto max-w-[720px]">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Blocked users
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            People you blocked can't follow or message you.
          </div>
        </div>

        <button
          onClick={() => nav("/profile/edit")}
          className="h-9 px-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition shrink-0"
        >
          Back
        </button>
      </div>

      {error && (
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-red-100 dark:border-red-900 shadow-sm p-4 mb-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/70 dark:border-gray-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-gray-500 dark:text-gray-400">
            Loading…
          </div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500 dark:text-gray-400">
            You haven't blocked anyone.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                {u.avatarUrl ? (
                  <img
                    src={u.avatarUrl}
                    alt={u.name}
                    className="h-11 w-11 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="h-11 w-11 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 grid place-items-center text-gray-700 dark:text-gray-200 font-semibold shrink-0">
                    {(u.name?.[0] ?? "U").toUpperCase()}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {u.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Blocked {formatDate(u.blockedAt)}
                  </div>
                </div>

                <button
                  onClick={() => unblock(u)}
                  disabled={!!pending[u.id]}
                  className="h-9 px-4 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-60 shrink-0"
                >
                  {pending[u.id] ? "…" : "Unblock"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
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
