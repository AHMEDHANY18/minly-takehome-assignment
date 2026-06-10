import type { ReactNode } from "react";
import { formatCompact } from "@/shared/utils/format";
import { useAdminStats } from "../hooks/useAdminStats";

export default function StatsTab() {
  const { stats, metrics, loading, error, reload } = useAdminStats();

  if (error) {
    return (
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900 p-4 shadow-sm">
        <div className="text-sm text-red-600 dark:text-red-400 font-semibold">
          Failed to load stats
        </div>
        <div className="text-xs text-gray-500 dark:text-zinc-400 mt-1">{error}</div>
        <button
          onClick={reload}
          className="mt-3 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
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
            className="h-[104px] rounded-2xl bg-gray-200/70 dark:bg-zinc-800 animate-pulse"
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
        <StatCard label="Users" value={stats?.users ?? 0} icon={<UsersIcon />} />
        <StatCard label="Media" value={stats?.media ?? 0} icon={<ImageIcon />} />
        <StatCard
          label="Comments"
          value={stats?.comments ?? 0}
          icon={<CommentIcon />}
        />
        <StatCard label="Likes" value={stats?.likes ?? 0} icon={<HeartIcon />} />
        <StatCard
          label="Reports"
          value={stats?.reports?.total ?? 0}
          icon={<FlagIcon />}
        />
        <StatCard
          label="Pending reports"
          value={stats?.reports?.pending ?? 0}
          accent={(stats?.reports?.pending ?? 0) > 0}
          icon={<ClockIcon />}
        />
        <StatCard
          label="Conversations"
          value={stats?.conversations ?? 0}
          icon={<SendIcon />}
        />
        <StatCard
          label="Active stories"
          value={stats?.activeStories ?? 0}
          icon={<ZapIcon />}
        />
      </div>

      {/* Server metrics */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 shadow-sm p-4">
        <div className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
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
          <div className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">
            Top routes
          </div>

          {topRoutes.length === 0 ? (
            <div className="mt-2 text-sm text-gray-400 dark:text-zinc-500">
              No request data yet.
            </div>
          ) : (
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 dark:text-zinc-500 border-b border-gray-100 dark:border-zinc-800">
                    <th className="py-2 pr-4 font-semibold">Route</th>
                    <th className="py-2 pr-4 font-semibold text-right">Count</th>
                    <th className="py-2 font-semibold text-right">Avg ms</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
                  {topRoutes.map((r) => (
                    <tr key={r.route}>
                      <td className="py-2 pr-4 font-mono text-[12px] text-gray-700 dark:text-zinc-300 truncate max-w-[280px]">
                        {r.route}
                      </td>
                      <td className="py-2 pr-4 text-right font-mono text-[12px] tabular-nums text-gray-900 dark:text-zinc-100 font-semibold">
                        {formatCompact(r.count)}
                      </td>
                      <td className="py-2 text-right font-mono text-[12px] tabular-nums text-gray-600 dark:text-zinc-400">
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
  icon,
}: {
  label: string;
  value: number;
  accent?: boolean;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 shadow-sm p-4">
      <div
        className={[
          "h-9 w-9 rounded-xl grid place-items-center",
          accent
            ? "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400"
            : "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400",
        ].join(" ")}
      >
        {icon}
      </div>
      <div
        className={[
          "mt-3 text-2xl font-bold tabular-nums",
          accent
            ? "text-amber-700 dark:text-amber-300"
            : "text-gray-900 dark:text-zinc-100",
        ].join(" ")}
      >
        {formatCompact(value)}
      </div>
      <div className="mt-0.5 text-xs text-gray-400 dark:text-zinc-500">{label}</div>
    </div>
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 p-3">
      <div className="text-sm font-semibold tabular-nums text-gray-900 dark:text-zinc-100">
        {value}
      </div>
      <div className="text-xs text-gray-500 dark:text-zinc-400">{label}</div>
    </div>
  );
}

/* ---------------- Icons (feather, stroke) ---------------- */

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function UsersIcon() {
  return (
    <Icon>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Icon>
  );
}

function ImageIcon() {
  return (
    <Icon>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </Icon>
  );
}

function CommentIcon() {
  return (
    <Icon>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </Icon>
  );
}

function HeartIcon() {
  return (
    <Icon>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </Icon>
  );
}

function FlagIcon() {
  return (
    <Icon>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </Icon>
  );
}

function ClockIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </Icon>
  );
}

function SendIcon() {
  return (
    <Icon>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </Icon>
  );
}

function ZapIcon() {
  return (
    <Icon>
      <polygon points="13 2 3 14 12 14 11 22 21 10 13 2" />
    </Icon>
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
