import { useCallback, useEffect, useState } from "react";
import type { AxiosError } from "axios";
import type { ReportStatus } from "@/shared/api/report.api";
import { AdminAPI, type AdminReport } from "../api/admin.api";

export type ReportFilter = ReportStatus | "ALL";

const LIMIT = 10;

export function useAdminReports(filter: ReportFilter) {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (p: number, mode: "replace" | "append") => {
      try {
        setError(null);
        const res = await AdminAPI.reports({
          status: filter === "ALL" ? undefined : filter,
          page: p,
          limit: LIMIT,
        });
        const d = res.data.data;

        setReports((prev) =>
          mode === "append" ? [...prev, ...(d.reports ?? [])] : d.reports ?? []
        );
        setTotal(d.total ?? 0);
        setHasMore(!!d.hasMore);
        setPage(p);
      } catch (error) {
        setError(getErrorMessage(error, "Failed to load reports."));
      }
    },
    [filter]
  );

  useEffect(() => {
    setInitialLoading(true);
    fetchPage(1, "replace").finally(() => setInitialLoading(false));
  }, [fetchPage]);

  const reload = useCallback(async () => {
    setInitialLoading(true);
    await fetchPage(1, "replace").finally(() => setInitialLoading(false));
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || initialLoading) return;
    setLoadingMore(true);
    await fetchPage(page + 1, "append").finally(() => setLoadingMore(false));
  }, [fetchPage, hasMore, loadingMore, initialLoading, page]);

  const updateReportLocal = useCallback(
    (id: string, updater: (r: AdminReport) => AdminReport) => {
      setReports((prev) => prev.map((r) => (r.id === id ? updater(r) : r)));
    },
    []
  );

  return {
    reports,
    total,
    hasMore,
    initialLoading,
    loadingMore,
    error,
    reload,
    loadMore,
    updateReportLocal,
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return (
    axiosError.response?.data?.message ??
    (error instanceof Error ? error.message : fallback)
  );
}
