// src/observability/metrics.ts
// In-memory request metrics — no new deps, reset on process restart.

type RouteStat = {
  count: number;
  totalMs: number;
};

const MAX_TRACKED_ROUTES = 200;

let total = 0;
let errors5xx = 0;
const byRoute = new Map<string, RouteStat>();

export function recordRequest(
  route: string,
  statusCode: number,
  durationMs: number
) {
  total += 1;
  if (statusCode >= 500) errors5xx += 1;

  let stat = byRoute.get(route);
  if (!stat) {
    // bound cardinality (unmatched 404 paths are already collapsed by the caller)
    if (byRoute.size >= MAX_TRACKED_ROUTES) return;
    stat = { count: 0, totalMs: 0 };
    byRoute.set(route, stat);
  }

  stat.count += 1;
  stat.totalMs += durationMs;
}

export function getMetricsSnapshot() {
  const memory = process.memoryUsage();

  return {
    uptimeSeconds: Math.round(process.uptime()),
    memory: {
      rss: memory.rss,
      heapUsed: memory.heapUsed,
    },
    requests: {
      total,
      errors5xx,
      byRoute: Array.from(byRoute.entries())
        .map(([route, stat]) => ({
          route,
          count: stat.count,
          avgMs: Math.round(stat.totalMs / stat.count),
        }))
        .sort((a, b) => b.count - a.count),
    },
  };
}
