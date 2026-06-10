import { formatCompact } from "@/shared/utils/format";
import { useAdminStats } from "../hooks/useAdminStats";

export default function StatsTab() {
  const { stats, metrics, loading, error, reload } = useAdminStats();

  if (error) {
    return (
      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-red-100 dark:border-red-900 p-4 shadow-sm">
        <div className="text-sm text-red-600 dark:text-red-400 font-semibold">
          Failed to load stats
        </div>
        <div className="text-xs text-gray-500 mt-1">{error}</div>
        <button
          onClick={reload}
          className="mt-3 text-sm font-semibold text-blue-700 dark:text-blue-400 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-[88px] rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm animate-pulse"
          />
        ))}
      </div>
    );
  }

  const topRoutes = [...(metrics?.requests.byRoute ?? [])]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Users" value={stats?.users ?? 0} />
        <StatCard label="Media" value={stats?.media ?? 0} />
        <StatCard label="Comments" value={stats?.comments ?? 0} />
        <StatCard label="Likes" value={stats?.likes ?? 0} />
        <StatCard label="Reports" value={stats?.reports?.total ?? 0} />
        <StatCard
          label="Pending reports"
          value={stats?.reports?.pending ?? 0}
          accent={(stats?.reports?.pending ?? 0) > 0}
        />
        <StatCard label="Conversations" value={stats?.conversations ?? 0} />
        <StatCard label="Active stories" value={stats?.activeStories ?? 0} />
      </div>

      {/* Server metrics */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-4">
        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Server metrics
        </div>

        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCell label="Uptime" value={formatUptime(metrics?.uptimeSeconds ?? 0)} />
          <MetricCell label="RSS memory" value={formatBytes(metrics?.memory.rss ?? 0)} />
          <MetricCell
            label="Heap used"
            value={formatBytes(metrics?.memory.heapUsed ?? 0)}
          />
          <MetricCell
            label="Requests / 5xx"
            value={`${formatCompact(metrics?.requests.total ?? 0)} / ${
              metrics?.requests.errors5xx ?? 0
            }`}
          />
        </div>

        {/* Top routes */}
        <div className="mt-5">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Top routes
          </div>

          {topRoutes.length === 0 ? (
            <div className="mt-2 text-sm text-gray-400">No request data yet.</div>
          ) : (
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-100 dark:border-gray-800">
                    <th className="py-2 pr-4 font-semibold">Route</th>
                    <th className="py-2 pr-4 font-semibold text-right">Count</th>
                    <th className="py-2 font-semibold text-right">Avg ms</th>
                  </tr>
                </thead>
                <tbody>
                  {topRoutes.map((r) => (
                    <tr
                      key={r.route}
                      className="border-b border-gray-50 dark:border-gray-800/60 last:border-0"
                    >
                      <td className="py-2 pr-4 font-mono text-[12px] text-gray-700 dark:text-gray-300 truncate max-w-[280px]">
                        {r.route}
                      </td>
                      <td className="py-2 pr-4 text-right text-gray-900 dark:text-gray-100 font-semibold">
                        {formatCompact(r.count)}
                      </td>
                      <td className="py-2 text-right text-gray-600 dark:text-gray-300">
                        {Math.round(r.avgMs)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Bits ---------------- */

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl border shadow-sm p-4",
        accent
          ? "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-900"
          : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800",
      ].join(" ")}
    >
      <div
        className={[
          "text-2xl font-bold",
          accent
            ? "text-amber-700 dark:text-amber-300"
            : "text-gray-900 dark:text-gray-100",
        ].join(" ")}
      >
        {formatCompact(value)}
      </div>
      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-3">
      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{value}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}

function formatUptime(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s % 60}s`;
}

function formatBytes(bytes: number) {
  if (!bytes || bytes <= 0) return "0 MB";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb.toFixed(1)} MB`;
}
