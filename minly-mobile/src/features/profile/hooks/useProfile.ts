// src/features/profile/hooks/useProfile.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import { ProfileAPI, type ProfileMediaItem, type ProfileTab, type ProfileResponse } from "../api/profile";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function useProfile(userId: string | null, initialTab: ProfileTab = "ALL", limit = 24) {
  const [user, setUser] = useState<ProfileResponse["data"]["user"] | null>(null);
  const [items, setItems] = useState<ProfileMediaItem[]>([]);
  const [tab, setTab] = useState<ProfileTab>(initialTab);

  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isMe, setIsMe] = useState(false);

  // ✅ remove local item (for delete UI)
  const removeLocalItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  // ✅ لو tab = SAVED → ما نطلبش من الباك (saved له API تاني)
  const backendTab = useMemo(() => (tab === "SAVED" ? "ALL" : tab), [tab]);

  const fetchPage = useCallback(
    async (opts?: { reset?: boolean }) => {
      if (loading) return;

      const reset = !!opts?.reset;
      const targetPage = reset ? 1 : page;

      setLoading(true);
      setError(null);

      try {
        const res = await ProfileAPI.get({
          userId: userId ?? undefined,
          page: clamp(targetPage, 1, 10_000),
          limit: clamp(limit, 1, 50),
          tab: backendTab,
        });

        const payload = res.data.data;

        setUser(payload.user);
        setIsMe(!!payload.meta?.isMe);

        setItems((prev) => (reset ? payload.media : [...prev, ...payload.media]));

        setHasNext(!!payload.pagination?.hasNext);
        setPage(targetPage + 1);
      } catch (e: any) {
        setError(e?.response?.data?.message ?? "Failed to load profile");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [loading, page, limit, userId, backendTab]
  );

  // ✅ أول مرة + عند تغيير tab أو userId
  useEffect(() => {
    // لو فتحنا user profile و tab كان SAVED بالغلط
    // نخليه ALL
    if (userId && tab === "SAVED") {
      setTab("ALL");
      return;
    }

    fetchPage({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, userId]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    fetchPage({ reset: true });
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (!hasNext || loading) return;
    fetchPage({ reset: false });
  }, [hasNext, loading, fetchPage]);

  return {
    user,
    items,
    tab,
    setTab,

    loading,
    refreshing,
    error,
    hasNext,

    isMe,

    refresh,
    loadMore,

    removeLocalItem,
  };
}
