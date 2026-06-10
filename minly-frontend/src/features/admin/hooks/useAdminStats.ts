import { useCallback, useEffect, useState } from "react";
import type { AxiosError } from "axios";
import { AdminAPI, type AdminMetrics, type AdminStats } from "../api/admin.api";

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, metricsRes] = await Promise.all([
        AdminAPI.stats(),
        AdminAPI.metrics(),
      ]);
      setStats(statsRes.data.data);
      setMetrics(metricsRes.data.data);
    } catch (error) {
      const ax = error as AxiosError<{ message?: string }>;
      setError(
        ax.response?.data?.message ??
          (error instanceof Error ? error.message : "Failed to load stats.")
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { stats, metrics, loading, error, reload: load };
}
